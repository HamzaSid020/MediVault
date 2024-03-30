// apiFunctions.js
const express = require('express');
const router = express.Router();
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');
require('dotenv').config();
const {
    HospitalInfo,
    PatientInfo,
    Report,
    Bills,
    Prescription,
    Appointment,
    PatientLogin,
    HospitalLogin,
    HospitalCodes,
    ContactUsMessage,
} = require('./models');

const sendEmail  = require('./emailFunctions');
router.use(express.json()); // This middleware will parse JSON data in the request body
router.use(cookieParser());
router.use(express.static('public'));
router.use(
    session({
        secret:  process.env.SESSION_SECRET, // Change this to a secure random string
        resave: false,
        saveUninitialized: true,
    })
);

const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.IMAGE_DESTINATION);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const reportStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.REPORT_DESTINATION);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const prescriptionStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.PRESCRIPTION_DESTINATION);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const billStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.BILL_DESTINATION);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const uploadImage = multer({ storage: imageStorage });
const uploadReport = multer({ storage: reportStorage });
const uploadPrescription = multer({ storage: prescriptionStorage });
const uploadBill = multer({ storage: billStorage });

async function hashPassword(plainTextPassword) {
    return new Promise((resolve, reject) => {
        
        bcrypt.genSalt(process.env.SALT_ROUNDS, function (err, salt) {
            if (err) {
                reject(err);
            } else {
                bcrypt.hash(plainTextPassword, salt, function (err, hash) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(hash);
                    }
                });
            }
        });
    });
}

function generateRandomPassword() {
    const length = 6;
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset.charAt(randomIndex);
    }
    return password;
}

function generateMedivaultId(firstName, lastName, phoneNumber) {
    // Extracting the first letter of the first name
    const firstLetter = firstName.charAt(0).toUpperCase();
    const lastFourLetters = lastName.slice(0, 4).toUpperCase();
    const lastFourDigits = extractLastFourDigits(phoneNumber);
    const medivaultId = firstLetter + lastFourLetters + lastFourDigits;

    return medivaultId;
}

async function hashOHIP(plainTextOHIP) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(plainTextOHIP, salt);
    return hash;
}

async function compareOHIP(newPlainTextOHIP, existingHashedOHIP) {
    try {
        // Compare the new OHIP number with the existing hashed OHIP number
        const match = await bcrypt.compare(newPlainTextOHIP, existingHashedOHIP);
        
        // Return the result of the comparison
        return match;
    } catch (error) {
        console.error('Error comparing OHIP numbers:', error);
        throw error; // Propagate the error
    }
}

function calculateAge(birthDate) {
    // Split the date string into day, month, and year
    const [year, month, day] = birthDate.split('-').map(Number);

    // Create a Date object with the provided values
    const birthDateObject = new Date(year, month - 1, day);
    const currentDate = new Date();
    const age = currentDate.getFullYear() - birthDateObject.getFullYear();

    // Adjust age based on the month and day
    if (currentDate.getMonth() < birthDateObject.getMonth() ||
        (currentDate.getMonth() === birthDateObject.getMonth() && currentDate.getDate() < birthDateObject.getDate())) {
        // If the birthdate has not occurred yet this year, subtract 1 from the age
        return age - 1;
    } else {
        return age;
    }
}

function extractLastFourDigits(phoneNumber) {
    const phoneNumberString = phoneNumber.toString();
    const lastFourDigits = phoneNumberString.slice(-4);
    return lastFourDigits;
}

function generateRandomSuffix(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        suffix += characters[randomIndex];
    }
    return suffix;
}

// Function to generate a random code based on patient information
function generateRandomCode(patientInfo) {
    // Example: Concatenate the first three characters of the name and age
    const namePrefix = patientInfo.Name.slice(0, 3).toUpperCase();
    const ageSuffix = patientInfo.Age.toString().padStart(2, '0'); // Ensure age is always two digits
    const randomSuffix = generateRandomSuffix(4); // Generate a random 4-character suffix

    // Combine the parts to create the random code
    const randomCode = namePrefix + ageSuffix + randomSuffix;

    return randomCode;
}

async function createHospitalCodeForPatient(patientInfo) {
    const hospitalIds = patientInfo.Hospital_Ids;

    for (const hospitalId of hospitalIds) {
        const codeExists = await HospitalCodes.findOne({ Patient_Id: patientInfo._id, Hospital_Id: hospitalId });

        if (!codeExists) {
            const code = generateRandomCode(patientInfo);
            await HospitalCodes.create({ Code: code, Patient_Id: patientInfo._id, Hospital_Id: hospitalId });
            console.log(`Hospital code created for ${patientInfo.Name} at ${hospitalId}`);
        } else {
            console.log(`Hospital code already exists for ${patientInfo.Name} at ${hospitalId}`);
        }
    }
}

async function convertToOriginalData(formattedData, isCreating = false) {
    // Combine the first and last name into the original 'Name' field
    const name = `${formattedData.firstName} ${formattedData.lastName}`.trim();

    // Combine the street, city, zip code, and province into the original 'Address' field
    const address = `${formattedData.streetName}, ${formattedData.city}, ${formattedData.province} ${formattedData.zipCode}`;

    // Map the 'gender' back to the original 'Sex' field
    const genderMap = {
        'male': 'M',
        'female': 'F',
        'other': 'X' // Add more mappings as needed
    };
    const sex = genderMap[formattedData.gender] || '';

    const currentDate = new Date();
    const formattedCurrentTime = currentDate.toISOString();
    let originalData = '';

    if (isCreating) {
        const medivaultId = generateMedivaultId(formattedData.firstName, formattedData.lastName, formattedData.mobileNumber);
        originalData = {
            Medivault_Id: medivaultId,
            Name: name,
            Phone_No: formattedData.mobileNumber,
            DOB: formattedData.dob,
            Sex: sex,
            Address: address,
            Email: formattedData.emailAddress,
            OHIP_Number: await hashOHIP(formattedData.ohip), // Now the hashed OHIP is available
            Patient_Id: formattedData.patientId,
            Last_Updated_Time: formattedCurrentTime
        };

    }
    else {
        originalData = {
            Name: name,
            Phone_No: formattedData.mobileNumber,
            DOB: formattedData.dob,
            Sex: sex,
            Address: address,
            Email: formattedData.emailAddress,
            Patient_Id: formattedData.patientId,
            Last_Updated_Time: formattedCurrentTime
        };
    }

    return originalData;
}

router.get('/', async (req, res) => {
    try {
        if (req.session.loggedIn == true) {
            if (req.session.hospitalLoggedId) {
                res.render('home', { Username: req.session.username, HospitalId: req.session.hospitalLoggedId });
            }
            else {
                res.render('home', { Username: req.session.username }); // Corrected the object syntax
            }
        } else {
            res.render('home', { Username: null });
        }
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/patient-login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Received request:', username, password); // Check if request body is received correctly

    try {
        const user = await PatientLogin.findOne({ Username: username });
        console.log('User:', user); // Check if user is found

        if (user) {
            // Compare entered password with hashed password
            const passwordMatch = await bcrypt.compare(password, user.Password);
            console.log('Password Match:', passwordMatch);

            if (passwordMatch) {
                const patientInfo = await PatientInfo.findOne({ _id: user.Patient_Id });
                console.log('Patient Info:', patientInfo); // Check if patient information is found

                if (patientInfo) {
                    req.session.loggedIn = true;
                    req.session.username = patientInfo.Name;
                    req.session.medivaultId = patientInfo.Medivault_Id; // Store medivaultId in the session
                    res.status(200).json({ message: 'Login successful' });
                } else {
                    res.status(500).json({ message: 'Patient information not found' });
                }
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error:', error); // Log the error for debugging
        res.status(500).json({ error: error.message });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

router.post('/hospital-login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Received request:', username, password); // Check if request body is received correctly

    try {
        const user = await HospitalLogin.findOne({ Username: username });
        console.log('User:', user); // Check if user is found     

        if (user) {
            // Compare entered password with hashed password
            const passwordMatch = await bcrypt.compare(password, user.Password);
            console.log('Password Match:', passwordMatch);

            if (passwordMatch) {
                const hospitalInfo = await HospitalInfo.findOne({ _id: user.Hospital_Id });
                console.log('Hospital Info:', hospitalInfo); // Check if hospital information is found

                if (hospitalInfo) {
                    req.session.hospitalLoggedId = hospitalInfo._id;
                    req.session.loggedIn = true;
                    req.session.username = hospitalInfo.Name;
                    res.status(200).json({ message: 'Login successful' });
                } else {
                    res.status(500).json({ message: 'Hospital information not found' });
                }
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error:', error); // Log the error for debugging
        res.status(500).json({ error: error.message });
    }
});

router.get('/patientRegistration', async (req, res) => {
    try {
        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }

        const hospitalId = req.session.hospitalLoggedId;
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).send('Hospital not found');
        }

        res.render('patientRegistration', { hospital });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patientLogin', async (req, res) => {
    try {

        res.render('patientLogin');
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/contactUs', async (req, res) => {
    try {
        if (req.session.loggedIn == true) {
            if (req.session.hospitalLoggedId) {
                res.render('contactUs', { Username: req.session.username, HospitalId: req.session.hospitalLoggedId });
            }
            else {
                res.render('contactUs', { Username: req.session.username, HospitalId: null }); // Corrected the object syntax
            }
        } else {
            res.render('contactUs', { Username: null, HospitalId: null });
        }

    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patientReport', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
        }
        const medivaultId = req.session.medivaultId;
        // Get the patient ID from the URL parameters
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        const patientId = patientInfo._id;
        // Find all reports related to the patient using the Patient_Id
        const reports = await Report.find({ Patient_Id: patientId })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log(patientInfo);
        console.log(reports);

        const unreadNotificationsCount = patientInfo.Notifications.filter(notification => !notification.read).length;

        res.render('patientReportInfo', { patientInfo: patientInfo, report_info: reports, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalReportInfo/:medivaultId', async (req, res) => {

    try {
        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }
        const medivaultId = req.params.medivaultId;
        const hospitalId = req.session.hospitalLoggedId;

        // Get the patient ID from the URL parameters
        const patientInfo = await PatientInfo.findOne({
            Medivault_Id: medivaultId,
            Hospital_Ids: { $elemMatch: { $eq: hospitalId } }
        });
        const patientId = patientInfo._id;
        // Find all reports related to the patient using the Patient_Id
        const reports = await Report.find({
            Patient_Id: patientId,
            Hospital_Id: hospitalId
        }).populate('Hospital_Id').exec();

        // Pass the patient ID to the render function
        console.log(patientInfo);
        console.log(reports);

        res.render('hospitalReportInfo', { patientInfo: patientInfo, report_info: reports });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patientPrescriptionEdit', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
        }
        const medivaultId = req.session.medivaultId;
        // Get the patient ID from the URL parameters
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        const patientId = patientInfo._id;
        // Find all reports related to the patient using the Patient_Id
        const reports = await Report.find({ Patient_Id: patientId })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log(patientInfo);
        console.log(reports);

        res.render('patientReportEdit', { patientInfo: patientInfo, report_info: reports });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patientReportEdit', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
        }
        const medivaultId = req.session.medivaultId;
        // Get the patient ID from the URL parameters
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        const patientId = patientInfo._id;
        // Find all reports related to the patient using the Patient_Id
        const reports = await Report.find({ Patient_Id: patientId })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log(patientInfo);
        console.log(reports);

        res.render('patientReportEdit', { patientInfo: patientInfo, report_info: reports });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patientAppointment', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
        }
        // Get the patient ID from the URL parameters
        const medivaultId = req.session.medivaultId;
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        const patientId = patientInfo._id;
        // Find all appointment related to the patient using the Patient_Id
        const appointment = await Appointment.find({ Patient_Id: patientId })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log(patientInfo);
        console.log(appointment);
        const unreadNotificationsCount = patientInfo.Notifications.filter(notification => !notification.read).length;

        res.render('patientAppointmentInfo', { patientInfo: patientInfo, appointment_info: appointment, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalAppointmentInfo/:medivaultId', async (req, res) => {
    try {
        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }
        // Get the patient ID from the URL parameters
        const medivaultId = req.params.medivaultId;
        const hospitalId = req.session.hospitalLoggedId;

        // Get the patient ID from the URL parameters
        const patientInfo = await PatientInfo.findOne({
            Medivault_Id: medivaultId,
            Hospital_Ids: { $elemMatch: { $eq: hospitalId } }
        });
        const patientId = patientInfo._id;
        // Find all appointment related to the patient using the Patient_Id
        const appointment = await Appointment.find({
            Patient_Id: patientId,
            Hospital_Id: hospitalId
        })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log(patientInfo);
        console.log(appointment);

        res.render('hospitalAppointmentInfo', { patientInfo: patientInfo, appointment_info: appointment });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patientBill', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
        }
        // Get the patient ID from the URL parameters
        const medivaultId = req.session.medivaultId;
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        const patientId = patientInfo._id;
        // Find all bills related to the patient using the Patient_Id
        const bills = await Bills.find({ Patient_Id: patientId })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log("patientInfo:", patientInfo);
        console.log("BillInfo:", bills);
        const unreadNotificationsCount = patientInfo.Notifications.filter(notification => !notification.read).length;

        res.render('patientBillInfo', { patientInfo: patientInfo, bill_info: bills, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalBillInfo/:medivaultId', async (req, res) => {
    try {
        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }
        const medivaultId = req.params.medivaultId;
        const hospitalId = req.session.hospitalLoggedId;

        // Get the patient ID from the URL parameters
        const patientInfo = await PatientInfo.findOne({
            Medivault_Id: medivaultId,
            Hospital_Ids: { $elemMatch: { $eq: hospitalId } }
        });

        const patientId = patientInfo._id;
        // Find all bills related to the patient using the Patient_Id
        const bills = await Bills.find({
            Patient_Id: patientId,
            Hospital_Id: hospitalId
        })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log("patientInfo:", patientInfo);
        console.log("BillInfo:", bills);

        res.render('hospitalBillInfo', { patientInfo: patientInfo, bill_info: bills });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/patientPrescription', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
        }
        // Get the patient ID from the URL parameters
        const medivaultId = req.session.medivaultId;
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        const patientId = patientInfo._id;
        // Find all prescriptions related to the patient using the Patient_Id
        const prescriptions = await Prescription.find({ Patient_Id: patientId })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log("patientInfo:", patientInfo);
        console.log("PrescriptionInfo:", prescriptions);
        const unreadNotificationsCount = patientInfo.Notifications.filter(notification => !notification.read).length;

        res.render('patientPrescriptionInfo', { patientInfo: patientInfo, prescription_info: prescriptions, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalPrescriptionInfo/:medivaultId', async (req, res) => {
    try {
        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }
        const medivaultId = req.params.medivaultId;
        const hospitalId = req.session.hospitalLoggedId;
        // Get the patient ID from the URL parameters
        const patientInfo = await PatientInfo.findOne({
            Medivault_Id: medivaultId,
            Hospital_Ids: { $elemMatch: { $eq: hospitalId } }
        });

        const patientId = patientInfo._id;
        // Find all prescriptions related to the patient using the Patient_Id
        const prescriptions = await Prescription.find({
            Patient_Id: patientId,
            Hospital_Id: hospitalId
        })
            .populate('Hospital_Id')
            .exec();

        // Pass the patient ID to the render function
        console.log("patientInfo:", patientInfo);
        console.log("PrescriptionInfo:", prescriptions);

        res.render('hospitalPrescriptionInfo', { patientInfo: patientInfo, prescription_info: prescriptions });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalLogin', async (req, res) => {
    try {

        res.render('hospitalLogin');
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/download-report/:reportId', async (req, res) => {
    const reportId = req.params.reportId;

    try {
        const report = await Report.findById(reportId);

        // Check if the report exists
        if (!report) {
            return res.status(404).send('Report not found');
        }

        // Assuming the document file is stored as a file path or a URL in the report
        const documentPath = path.resolve(__dirname, '..', 'public', 'documents', 'reports', `${report.File}`);

        // In a real-world scenario, you might want to set appropriate headers for the file type
        res.download(documentPath, `Report_${report.File}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalDashboard/patients', async (req, res) => {
    try {

        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }
        const hospitalId = req.session.hospitalLoggedId;

        // Fetch the hospital information
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).send('Hospital not found');
        }

        // Fetch all patients associated with the hospital
        const patients = await PatientInfo.find({ Hospital_Ids: hospitalId });

        // Aggregate data for each patient
        const patientDataPromises = patients.map(async (patient) => {
            const patientId = patient._id;

            // Count the number of bills for the patient
            const numberOfBills = await Bills.countDocuments({ Patient_Id: patientId });

            // Count the number of prescriptions for the patient
            const numberOfPrescriptions = await Prescription.countDocuments({ Patient_Id: patientId });

            // Count the number of appointments for the patient
            const numberOfAppointments = await Appointment.countDocuments({ Patient_Id: patientId });

            // Count the number of reports for the patient
            const numberOfReports = await Report.countDocuments({ Patient_Id: patientId });

            return {
                patient,
                numberOfBills,
                numberOfPrescriptions,
                numberOfAppointments,
                numberOfReports,
            };
        });

        const patientData = await Promise.all(patientDataPromises);
        const unreadNotificationsCount = hospital.Notifications.filter(notification => !notification.read).length;

        // Render the hospital dashboard with the patients data
        res.render('hospitalPatients', { hospital, patientData, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalDashboard/appointments', async (req, res) => {
    try {

        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }

        const hospitalId = req.session.hospitalLoggedId;

        // Fetch the hospital information
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).send('Hospital not found');
        }

        // Find all appointment related to the patient using the Patient_Id
        const appointmentInfo = await Appointment.find({ Hospital_Id: hospitalId })
            .populate('Patient_Id')
            .exec();

        console.log(appointmentInfo);
        // Render the hospital dashboard with the patients data

        // Fetch all patients associated with the hospital
        const patients = await PatientInfo.find({ Hospital_Ids: hospitalId });

        // Aggregate data for each patient
        const patientDataPromises = patients.map(async (patient) => {
            const patientId = patient._id;

            // Count the number of bills for the patient
            const numberOfBills = await Bills.countDocuments({ Patient_Id: patientId });

            // Count the number of prescriptions for the patient
            const numberOfPrescriptions = await Prescription.countDocuments({ Patient_Id: patientId });

            // Count the number of appointments for the patient
            const numberOfAppointments = await Appointment.countDocuments({ Patient_Id: patientId });

            // Count the number of reports for the patient
            const numberOfReports = await Report.countDocuments({ Patient_Id: patientId });

            return {
                patient,
                numberOfBills,
                numberOfPrescriptions,
                numberOfAppointments,
                numberOfReports,
            };
        });

        const patientData = await Promise.all(patientDataPromises);
        const unreadNotificationsCount = hospital.Notifications.filter(notification => !notification.read).length;

        res.render('hospitalAppointments', { hospital, appointmentInfo, patients, patientData, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalDashboard/codes', async (req, res) => {
    try {

        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }

        const hospitalId = req.session.hospitalLoggedId;

        // Fetch the hospital information
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).send('Hospital not found');
        }

        // Find all hospital codes related to the hospital and populate the associated patient and hospital information
        const hospitalCodes = await HospitalCodes.find({ Hospital_Id: hospitalId })
            .populate('Patient_Id')
            .exec();

        // Fetch all patients associated with the hospital
        const patients = await PatientInfo.find({ Hospital_Ids: hospitalId });

        // Aggregate data for each patient
        const patientDataPromises = patients.map(async (patient) => {
            const patientId = patient._id;

            // Count the number of bills for the patient
            const numberOfBills = await Bills.countDocuments({ Patient_Id: patientId });

            // Count the number of prescriptions for the patient
            const numberOfPrescriptions = await Prescription.countDocuments({ Patient_Id: patientId });

            // Count the number of appointments for the patient
            const numberOfAppointments = await Appointment.countDocuments({ Patient_Id: patientId });

            // Count the number of reports for the patient
            const numberOfReports = await Report.countDocuments({ Patient_Id: patientId });

            return {
                patient,
                numberOfBills,
                numberOfPrescriptions,
                numberOfAppointments,
                numberOfReports,
            };
        });

        const patientData = await Promise.all(patientDataPromises);
        const unreadNotificationsCount = hospital.Notifications.filter(notification => !notification.read).length;

        res.render('hospitalCodes', { hospital, hospitalCodes, patientData, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalDashboard', async (req, res) => {
    try {
        if (!req.session.hospitalLoggedId) {
            // Handle the case when hospitalLoggedId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }

        const hospitalId = req.session.hospitalLoggedId;

        // Fetch the hospital information
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).send('Hospital not found');
        }

        // Fetch all patients associated with the hospital
        const patients = await PatientInfo.find({ Hospital_Ids: hospitalId });

        // Aggregate data for each patient
        const patientDataPromises = patients.map(async (patient) => {
            const patientId = patient._id;

            const numberOfBills = await Bills.countDocuments({ Patient_Id: patientId });
            const numberOfPrescriptions = await Prescription.countDocuments({ Patient_Id: patientId });
            const numberOfAppointments = await Appointment.countDocuments({ Patient_Id: patientId });
            const numberOfReports = await Report.countDocuments({ Patient_Id: patientId });

            return {
                patient,
                numberOfBills,
                numberOfPrescriptions,
                numberOfAppointments,
                numberOfReports,
            };
        });

        const patientData = await Promise.all(patientDataPromises);
        const hospitalNotifications = hospital.Notifications || [];
        const unreadNotificationsCount = hospital.Notifications.filter(notification => !notification.read).length;

        res.render('hospitalInbox', { hospital, patientData, hospitalNotifications, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalDashboard/reports', async (req, res) => {
    try {

        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }

        const hospitalId = req.session.hospitalLoggedId;

        // Fetch the hospital information
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).send('Hospital not found');
        }

        // Find all reports related to the hospital and populate the associated patient and hospital information
        const reports = await Report.find({ Hospital_Id: hospitalId })
            .populate('Patient_Id')
            .exec();

        // Fetch all patients associated with the hospital
        const patients = await PatientInfo.find({ Hospital_Ids: hospitalId });

        // Aggregate data for each patient
        const patientDataPromises = patients.map(async (patient) => {
            const patientId = patient._id;

            // Count the number of bills for the patient
            const numberOfBills = await Bills.countDocuments({ Patient_Id: patientId });

            // Count the number of prescriptions for the patient
            const numberOfPrescriptions = await Prescription.countDocuments({ Patient_Id: patientId });

            // Count the number of appointments for the patient
            const numberOfAppointments = await Appointment.countDocuments({ Patient_Id: patientId });

            // Count the number of reports for the patient
            const numberOfReports = await Report.countDocuments({ Patient_Id: patientId });

            return {
                patient,
                numberOfBills,
                numberOfPrescriptions,
                numberOfAppointments,
                numberOfReports,
            };
        });

        const patientData = await Promise.all(patientDataPromises);
        const unreadNotificationsCount = hospital.Notifications.filter(notification => !notification.read).length;

        res.render('hospitalReports', { hospital, reports, patients, patientData, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalDashboard/bills', async (req, res) => {
    try {

        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }

        const hospitalId = req.session.hospitalLoggedId;

        // Fetch the hospital information
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).send('Hospital not found');
        }

        // Find all bills related to the hospital and populate the associated patient and hospital information
        const bills = await Bills.find({ Hospital_Id: hospitalId })
            .populate('Patient_Id')
            .exec();

        // Fetch all patients associated with the hospital
        const patients = await PatientInfo.find({ Hospital_Ids: hospitalId });

        // Aggregate data for each patient
        const patientDataPromises = patients.map(async (patient) => {
            const patientId = patient._id;

            // Count the number of bills for the patient
            const numberOfBills = await Bills.countDocuments({ Patient_Id: patientId });

            // Count the number of prescriptions for the patient
            const numberOfPrescriptions = await Prescription.countDocuments({ Patient_Id: patientId });

            // Count the number of appointments for the patient
            const numberOfAppointments = await Appointment.countDocuments({ Patient_Id: patientId });

            // Count the number of reports for the patient
            const numberOfReports = await Report.countDocuments({ Patient_Id: patientId });

            return {
                patient,
                numberOfBills,
                numberOfPrescriptions,
                numberOfAppointments,
                numberOfReports,
            };
        });

        const patientData = await Promise.all(patientDataPromises);
        const unreadNotificationsCount = hospital.Notifications.filter(notification => !notification.read).length;

        res.render('hospitalBills', { hospital, bills, patients, patientData, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalDashboard/prescriptions', async (req, res) => {
    try {

        if (!req.session.hospitalLoggedId) {
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }

        const hospitalId = req.session.hospitalLoggedId;

        // Fetch the hospital information
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).send('Hospital not found');
        }

        // Find all bills related to the hospital and populate the associated patient and hospital information
        const prescriptions = await Prescription.find({ Hospital_Id: hospitalId })
            .populate('Patient_Id')
            .exec();

        // Fetch all patients associated with the hospital
        const patients = await PatientInfo.find({ Hospital_Ids: hospitalId });

        // Aggregate data for each patient
        const patientDataPromises = patients.map(async (patient) => {
            const patientId = patient._id;

            // Count the number of bills for the patient
            const numberOfBills = await Bills.countDocuments({ Patient_Id: patientId });

            // Count the number of prescriptions for the patient
            const numberOfPrescriptions = await Prescription.countDocuments({ Patient_Id: patientId });

            // Count the number of appointments for the patient
            const numberOfAppointments = await Appointment.countDocuments({ Patient_Id: patientId });

            // Count the number of reports for the patient
            const numberOfReports = await Report.countDocuments({ Patient_Id: patientId });

            return {
                patient,
                numberOfBills,
                numberOfPrescriptions,
                numberOfAppointments,
                numberOfReports,
            };
        });

        const patientData = await Promise.all(patientDataPromises);
        const unreadNotificationsCount = hospital.Notifications.filter(notification => !notification.read).length;

        res.render('hospitalPrescriptions', { hospital, prescriptions, patients, patientData, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/download-bill/:billId', async (req, res) => {
    const billId = req.params.billId;

    try {
        const bill = await Bills.findById(billId);

        // Check if the bill exists
        if (!bill) {
            return res.status(404).send('Bill not found');
        }

        // Assuming the document file is stored as a file path or a URL in the bill
        const documentPath = path.resolve(__dirname, '..', 'public', 'documents', 'bills', `${bill.File}`);

        // In a real-world scenario, you might want to set appropriate headers for the file type
        res.download(documentPath, `Bill_${bill.File}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/download-prescription/:prescriptionId', async (req, res) => {
    const prescriptionId = req.params.prescriptionId;

    try {
        const prescription = await Prescription.findById(prescriptionId);

        // Check if the prescription exists
        if (!prescription) {
            return res.status(404).send('Prescription not found');
        }

        // Assuming the document file is stored as a file path or a URL in the prescription
        const documentPath = path.resolve(__dirname, '..', 'public', 'documents', 'prescriptions', `${prescription.File}`);

        // In a real-world scenario, you might want to set appropriate headers for the file type
        res.download(documentPath, `Prescription_${prescription.File}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/patientUpdate', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
        }

        const { patientId, updatedData } = req.body;
        console.log('Updating patient:', patientId, updatedData);

        // Convert formatted data back to original structure
        const originalDataAgain = convertToOriginalData(updatedData);

        // Update the patient information in the database
        await PatientInfo.findByIdAndUpdate(
            patientId,
            { $set: originalDataAgain },
            { new: true }
        );

        // Fetch patient's information using the Patient_Id
        const patient = await PatientInfo.findById(patientId);
        if (!patient.notifications) {
            patient.notifications = [];
        }
        const notificationMessage = `Patient data updated for "${patient.Name}"`;
        patient.Notifications.push({ message: notificationMessage });

        // Save patient's updated information
        await patient.save();

        console.log('Patient updated successfully');
        res.sendStatus(200); // Send a simple 200 OK response
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.post('/patientCreate', async (req, res) => {
    try {
        if (!req.session.hospitalLoggedId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
        }

        const { newData } = req.body;
        console.log("New Patient Info Server", newData);

        const existingOHIPs = await PatientInfo.find({}, { OHIP_Number: 1, _id: 0 });
        const existingOHIPNumbers = existingOHIPs.map(patient => patient.OHIP_Number);

        for (const number of existingOHIPNumbers) {
            const match = await compareOHIP(newData.ohip, number);
            if (match) {
                return res.status(400).json({ success: false, message: 'OHIP number already exists' });
            }
        }

        // Convert formatted data to the structure expected by your model
        const formattedData = await convertToOriginalData(newData, true);
        const newMedivaultId = formattedData.Medivault_Id;
        const randomPassword = generateRandomPassword();
        formattedData.Hospital_Ids = [req.session.hospitalLoggedId];
        console.log("Formatted DOB", formattedData.DOB);
        formattedData.Age = calculateAge(formattedData.DOB);

        // Create a new patient entry in the database
        console.log("Medivault Id:", newMedivaultId, "Password", randomPassword);
        const newPatient = await PatientInfo.create(formattedData);
        const newPatientLogin = await PatientLogin.create({
            Username: newMedivaultId, // Using Medivault ID as the username
            Password: await hashPassword(randomPassword),
            Patient_Id: newPatient._id // Assigning the patient ID from the newly created patient
        });

        await createHospitalCodeForPatient(newPatient);

        const hospitalId = req.session.hospitalLoggedId;

        // Fetch hospital's information using the Hospital_Id
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `New Patient ${newPatient.Name} (MediVaultId: ${newPatient.Medivault_Id}) has been added`;
        hospital.Notifications.push({ message: hospitalNotificationMessage });

        // Save hospital's updated information
        await hospital.save();

        res.status(201).json({ message: 'Patient created successfully' });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.post('/linkPatient', async (req, res) => {
    try {
        // Extract OHIP number and hospital ID from the request body
        const { ohip } = req.body;
        let patientId;

        // Find all existing patients
        const existingPatients = await PatientInfo.find({});

        // Iterate through existing patients
        for (const ohipPatient of existingPatients) {
            // Compare the OHIP numbers
            const match = await compareOHIP(ohip, ohipPatient.OHIP_Number);
            if (match) {
                // If there's a match, store the patient ID and break the loop
                patientId = ohipPatient._id;
                break;
            }
        }

        // If no matching OHIP found, return a message
        if (!patientId) {
            return res.status(404).json({ success: false, message: 'No patient with the provided OHIP number found' });
        }

        // Find the patient by ID
        const patient = await PatientInfo.findById(patientId);

        // If patient is not found, return an error
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        const hospitalId = req.session.hospitalLoggedId;
        // Add the hospital ID to the patient's Hospital_Ids array
        if (!patient.Hospital_Ids.includes(hospitalId)) {
            patient.Hospital_Ids.push(hospitalId);
        }
        // Save the updated patient
        if (!patient.notifications) {
            patient.notifications = [];
        }
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `New Patient ${patient.Name} (MediVaultId: ${patient.Medivault_Id}) has been added`;
        hospital.Notifications.push({ message: hospitalNotificationMessage });

        // Save hospital's updated information
        const notificationMessage = `${hospital.Name} has been linked`;
        patient.Notifications.push({ message: notificationMessage });

        await hospital.save();
        await patient.save();

        await createHospitalCodeForPatient(patient);
        // Respond with success message
        res.status(200).json({ success: true, message: 'Hospital linked to patient successfully' });
    } catch (error) {
        console.error('Error linking hospital to patient:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


router.post('/upload', uploadImage.single('image'), async (req, res) => {
    if (!req.session.medivaultId) {
        // Handle the case when medivaultId is not present
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
    }
    console.log('Request received:', req.file);

    // Get the patient ID from the request body
    const { patientId } = req.body;

    // Find the patient by ID
    const patient = await PatientInfo.findById(patientId);

    if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
    }

    // If no file submitted, exit
    if (!req.file) {
        console.log('No file found in the request');
        return res.status(400).json({ error: 'No file found in the request' });
    }

    // If does not have image mime type prevent from uploading
    if (!/^image/.test(req.file.mimetype)) {
        console.log('Invalid image mime type:', req.file.mimetype);
        return res.status(400).json({ error: 'Invalid image mime type' });
    }
    const imagePath = path.join(__dirname, '../public/images/patient', patient.Picture);
    fs.unlinkSync(imagePath);
    // Update patient's picture field with the new image string
    patient.Picture = req.file.filename; // Assuming you store the filename in the Picture field
    patient.Last_Updated_Time = Date.now();

    // Fetch patient's information using the Patient_Id
    if (!patient.notifications) {
        patient.notifications = [];
    }
    const notificationMessage = `Patient image has been updated`;
    patient.Notifications.push({ message: notificationMessage });

    await patient.save();

    console.log('File uploaded successfully:', req.file);
    console.log('Updated Patient info:', patient);
    res.status(200).json({ message: 'File uploaded successfully' });
});

router.post('/uploadBill', uploadBill.single('file'), async (req, res) => {
    if (!req.session.loggedIn && !req.session.hospitalLoggedId) {
        // Handle the case when hospitalId is not present
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
    }
    const hospitalId = req.session.hospitalLoggedId;
    const file = req.file;
    const medivaultId = req.body.MedivaultId;
    const patientId = req.body.PatientId;

    try {
        let patient;
        if (medivaultId) {
            // Find the patient by Medivault Id
            patient = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        } else if (patientId) {
            // Find the patient by Patient Id
            patient = await PatientInfo.findById(patientId);
        } else {
            return res.status(400).json({ error: 'MedivaultId or PatientId is required' });
        }

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // If no file submitted, exit
        if (!req.file) {
            console.log('No file found in the request');
            return res.status(400).json({ error: 'No file found in the request' });
        }

        // Create a new bill record
        const newBill = new Bills({
            Category: 'Medical',
            Name: file.originalname,
            File: file.filename,
            Hospital_Id: hospitalId,
            Patient_Id: patient._id
        });

        // Save the new bill record
        await newBill.save();

        if (!patient.notifications) {
            patient.notifications = [];
        }
        const notificationMessage = `The bill "${newBill.Name}" has been added`;
        patient.Notifications.push({ message: notificationMessage });

        // Save patient's updated information
        await patient.save();

        // Fetch hospital's information using the Hospital_Id
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `The bill "${newBill.Name}" for Patient ${patient.Name} (MediVaultId: ${patient.Medivault_Id}) has been added`;
        hospital.Notifications.push({ message: hospitalNotificationMessage });

        // Save hospital's updated information
        await hospital.save();

        console.log('Updated Patient info:', patient);
        res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading Bill:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/uploadReport', uploadReport.single('file'), async (req, res) => {
    if (!req.session.loggedIn && !req.session.hospitalLoggedId) {
        // Handle the case when hospitalId is not present
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
    }
    const hospitalId = req.session.hospitalLoggedId;
    const file = req.file;
    // Get the patient ID from the request body
    const medivaultId = req.body.MedivaultId;
    const patientId = req.body.PatientId;

    try {
        let patient;
        if (medivaultId) {
            // Find the patient by Medivault Id
            patient = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        } else if (patientId) {
            // Find the patient by Patient Id
            patient = await PatientInfo.findById(patientId);
        } else {
            return res.status(400).json({ error: 'MedivaultId or PatientId is required' });
        }

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // If no file submitted, exit
        if (!req.file) {
            console.log('No file found in the request');
            return res.status(400).json({ error: 'No file found in the request' });
        }

        // Create a new report record
        const newReport = new Report({
            Category: 'Medical',
            Name: file.originalname,
            File: file.filename,
            Hospital_Id: hospitalId,
            Patient_Id: patient._id
        });

        // Save the new report record
        await newReport.save();


        if (!patient.notifications) {
            patient.notifications = [];
        }
        const notificationMessage = `The report "${newReport.Name}" has been added`;
        patient.Notifications.push({ message: notificationMessage });

        // Save patient's updated information
        await patient.save();

        // Fetch hospital's information using the Hospital_Id
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `The report "${newReport.Name}" for Patient ${patient.Name} (MediVaultId: ${patient.Medivault_Id}) has been added`;
        hospital.Notifications.push({ message: hospitalNotificationMessage });

        // Save hospital's updated information
        await hospital.save();

        console.log('Updated Patient info:', patient);
        res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/uploadPrescription', uploadPrescription.single('file'), async (req, res) => {
    if (!req.session.loggedIn && !req.session.hospitalLoggedId) {
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
    }

    console.log('Request received:', req.file);
    const hospitalId = req.session.hospitalLoggedId;
    const file = req.file;
    const medivaultId = req.body.MedivaultId;
    const patientId = req.body.PatientId;

    try {
        let patient;
        if (medivaultId) {
            patient = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        } else if (patientId) {
            patient = await PatientInfo.findById(patientId);
        } else {
            return res.status(400).json({ error: 'MedivaultId or PatientId is required' });
        }

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // If no file submitted, exit
        if (!req.file) {
            console.log('No file found in the request');
            return res.status(400).json({ error: 'No file found in the request' });
        }

        // Create a new report record
        const newPrescription = new Prescription({
            Name: file.originalname,
            File: file.filename,
            Hospital_Id: hospitalId,
            Patient_Id: patient._id
        });

        // Save the new report record
        await newPrescription.save();

        if (!patient.notifications) {
            patient.notifications = [];
        }
        const notificationMessage = `The prescription "${newPrescription.Name}" has been added`;
        patient.Notifications.push({ message: notificationMessage });

        // Save patient's updated information
        await patient.save();

        // Fetch hospital's information using the Hospital_Id
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `The prescription "${newPrescription.Name}" for Patient ${patient.Name} (MediVaultId: ${patient.Medivault_Id}) has been added`;
        hospital.Notifications.push({ message: hospitalNotificationMessage });

        // Save hospital's updated information
        await hospital.save();

        console.log('Updated Patient info:', patient);
        res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading Prescription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/deletePatientImage', async (req, res) => {
    try {
        const { patientId } = req.body;

        // Example using Mongoose:
        const patient = await PatientInfo.findById(patientId);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        const imagePath = path.join(__dirname, '../public/images/patient', patient.Picture);
        fs.unlinkSync(imagePath);
        patient.Picture = '';
        patient.Last_Updated_Time = Date.now();

        // Fetch patient's information using the Patient_Id
        if (!patient.notifications) {
            patient.notifications = [];
        }

        const notificationMessage = `Patient image has been deleted`;
        patient.Notifications.push({ message: notificationMessage });

        // Save patient's updated information
        await patient.save();
        console.log('Image deleted for patient:', patientId);

        res.sendStatus(200);
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/downloadReport', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).json({ success: false, message: 'Please log in first.' });
        }

        const medivaultId = req.session.medivaultId;
        const hospitalCode = req.body.hospitalCode; // Get hospital code from the request body

        // Step 1: Find the patient ID based on the medivaultId
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });

        if (!patientInfo) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        const patientId = patientInfo._id.toString();
        const hospitalId = req.session.hospitalId;
        const reportId = req.session.reportId; // Assuming you have the reportId stored in the session

        //Reset
        delete req.session.reportId;
        delete req.session.hospitalId;

        // Step 2: Check if there is a corresponding entry in HospitalCodes
        const hospitalCodeEntry = await HospitalCodes.findOne({
            Code: hospitalCode,
            Patient_Id: patientId,
            Hospital_Id: hospitalId
        });

        if (!hospitalCodeEntry) {
            return res.status(404).json({ success: false, message: 'Invalid hospital code.' });
        }

        // If everything is valid, send the reportId in the response
        res.json({ success: true, reportId: reportId, message: 'Download request received successfully.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

router.post('/downloadPrescription', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).json({ success: false, message: 'Please log in first.' });
        }

        const medivaultId = req.session.medivaultId;
        const hospitalCode = req.body.hospitalCode; // Get hospital code from the request body

        // Step 1: Find the patient ID based on the medivaultId
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });

        if (!patientInfo) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        const patientId = patientInfo._id.toString();
        const hospitalId = req.session.hospitalId;
        const prescriptionId = req.session.prescriptionId; // Assuming you have the prescriptionId stored in the session

        //Reset
        delete req.session.reportId;
        delete req.session.hospitalId;

        // Step 2: Check if there is a corresponding entry in HospitalCodes
        const hospitalCodeEntry = await HospitalCodes.findOne({
            Code: hospitalCode,
            Patient_Id: patientId,
            Hospital_Id: hospitalId
        });

        if (!hospitalCodeEntry) {
            return res.status(404).json({ success: false, message: 'Invalid hospital code.' });
        }

        // If everything is valid, send the reportId in the response
        res.json({ success: true, prescriptionId: prescriptionId, message: 'Download request received successfully.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

router.post('/downloadBill', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).json({ success: false, message: 'Please log in first.' });
        }

        const medivaultId = req.session.medivaultId;
        const hospitalCode = req.body.hospitalCode; // Get hospital code from the request body

        // Step 1: Find the patient ID based on the medivaultId
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });

        if (!patientInfo) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        const patientId = patientInfo._id.toString();
        const hospitalId = req.session.hospitalId;
        const billId = req.session.billId; // Assuming you have the reportId stored in the session

        //Reset
        delete req.session.reportId;
        delete req.session.hospitalId;

        // Step 2: Check if there is a corresponding entry in HospitalCodes
        const hospitalCodeEntry = await HospitalCodes.findOne({
            Code: hospitalCode,
            Patient_Id: patientId,
            Hospital_Id: hospitalId
        });

        if (!hospitalCodeEntry) {
            return res.status(404).json({ success: false, message: 'Invalid hospital code.' });
        }

        // If everything is valid, send the reportId in the response
        res.json({ success: true, billId: billId, message: 'Download request received successfully.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

router.post('/addHospitalReport', (req, res) => {
    // Extract data from the request body
    const reportId = req.body.reportId;
    const hospitalId = req.body.hospitalId;
    req.session.hospitalId = hospitalId;
    req.session.reportId = reportId;
    res.json({ status: 'success', message: 'Data received successfully' });
});

router.post('/addHospitalBill', (req, res) => {
    // Extract data from the request body
    const billId = req.body.billId;
    const hospitalId = req.body.hospitalId;
    req.session.hospitalId = hospitalId;
    req.session.billId = billId;
    res.json({ status: 'success', message: 'Data received successfully' });
});

router.post('/addHospitalPrescription', (req, res) => {
    // Extract data from the request body
    const prescriptionId = req.body.prescriptionId;
    const hospitalId = req.body.hospitalId;
    req.session.hospitalId = hospitalId;
    req.session.prescriptionId = prescriptionId;
    res.json({ status: 'success', message: 'Data received successfully' });
});

router.post('/sendHospitalCodeEmail', async (req, res) => {
    const medivaultId = req.session.medivaultId;

    try {
        // Find the patient information using the Medivault Id
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });

        if (!patientInfo) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        // Assuming the hospital code is stored in the HospitalCodes collection
        const hospitalCodeInfo = await HospitalCodes.findOne({ Patient_Id: patientInfo._id });

        if (!hospitalCodeInfo) {
            return res.status(404).json({ success: false, message: 'Hospital code not found for this patient.' });
        }

        // Extracting email and hospital code from retrieved data
        const email = patientInfo.Email;
        const hospitalCode = hospitalCodeInfo.Code;

        console.log('Email:', email);
        console.log('Hospital Code:', hospitalCode);


        // Sending the hospital code email using sendEmail function
        sendEmail(email,'MediVault Hospital Code', `Your hospital code is: ${hospitalCode}`);

        // Respond with a success message
        res.status(200).json({ success: true, message: 'Hospital code email sent successfully.', email, hospitalCode });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

router.post('/contactUsMessage', async (req, res) => {
    try {
        const { FirstName, LastName, EmailAddress, Message } = req.body;
        // Create new ContactUsMessage document
        const newMessage = new ContactUsMessage({
            FirstName,
            LastName,
            EmailAddress,
            Message
        });

        // Save the document to the database
        await newMessage.save();

        res.status(201).json({ message: 'Message added successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while adding the message' });
    }
});

router.post('/addDeleteReportId', (req, res) => {
    const reportId = req.body.reportId;

    // Assuming you are using express-session middleware to handle sessions
    req.session.deleteReportId = reportId;

    res.status(200).json({ message: 'Report ID added to session successfully' });
});

router.post('/addDeleteAppointmentId', (req, res) => {
    const appointmentId = req.body.appointmentId;

    // Assuming you are using express-session middleware to handle sessions
    req.session.deleteAppointmentId = appointmentId;

    res.status(200).json({ message: 'Appointment ID added to session successfully' });
});

router.post('/removeDeleteAppointmentId', (req, res) => {
    // Assuming you are using express-session middleware to handle sessions
    delete req.session.deleteAppointmentId;

    res.status(200).json({ message: 'Appointment ID removed from session successfully' });
});

router.post('/removeDeleteReportId', (req, res) => {
    // Assuming you are using express-session middleware to handle sessions
    delete req.session.reportId;

    res.status(200).json({ message: 'Report ID removed from session successfully' });
});

router.delete('/deleteAppointment', async (req, res) => {
    if (!req.session.loggedIn || !req.session.hospitalLoggedId) {
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
    }

    const appointmentId = req.session.deleteAppointmentId;
    try {
        const appointment = await Appointment.findOne({ _id: appointmentId, Hospital_Id: req.session.hospitalLoggedId });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or not authorized to delete' });
        }

        // Retrieve the Patient_Id associated with the report
        const patientId = appointment.Patient_Id;
        const hospitalId = req.session.hospitalLoggedId;

        // Fetch patient's information using the Patient_Id
        const patient = await PatientInfo.findById(patientId);
        if (!patient.notifications) {
            patient.notifications = [];
        }

        const notificationMessage = `The appointment "${appointment.Name}" has been deleted`;
        patient.Notifications.push({ message: notificationMessage });

        // Save patient's updated information
        await patient.save();

        // Fetch hospital's information using the Hospital_Id
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `The  appointment "${appointment.Name}" for Patient ${patient.Name} (MediVaultId: ${patient.Medivault_Id}) has been deleted`;
        hospital.Notifications.push({ message: hospitalNotificationMessage });

        // Save hospital's updated information
        await hospital.save();

        await Appointment.findOneAndDelete({ _id: appointmentId });

        res.status(200).json({ message: 'Appointment deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/deleteReport', async (req, res) => {
    if (!req.session.loggedIn || !req.session.hospitalLoggedId) {
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
    }

    const reportId = req.session.deleteReportId;
    try {
        // Check if the report exists and is linked to the logged-in hospital
        const report = await Report.findOne({ _id: reportId, Hospital_Id: req.session.hospitalLoggedId });

        if (!report) {
            return res.status(404).json({ message: 'Report not found or not authorized to delete' });
        }

        // Retrieve the Patient_Id associated with the report
        const patientId = report.Patient_Id;
        const hospitalId = req.session.hospitalLoggedId;

        // Fetch patient's information using the Patient_Id
        const patient = await PatientInfo.findById(patientId);
        if (!patient.notifications) {
            patient.notifications = [];
        }
        const notificationMessage = `The report "${report.Name}" has been deleted`;
        patient.Notifications.push({ message: notificationMessage });

        // Save patient's updated information
        await patient.save();

        // Fetch hospital's information using the Hospital_Id
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `The report "${report.Name}" for Patient ${patient.Name} (MediVaultId: ${patient.Medivault_Id}) has been deleted`;
        hospital.Notifications.push({ message: hospitalNotificationMessage });

        // Save hospital's updated information
        await hospital.save();

        // Delete the file from the file system
        const filePath = 'public/documents/reports/' + report.File;
        fs.unlink(filePath, async (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).json({ message: 'Error deleting file from the server' });
            }

            // Remove the report ID from Bills
            await Bills.updateMany({ Report_Ids: reportId }, { $pull: { Report_Ids: reportId } });

            // Remove the report ID from Prescription
            await Prescription.updateMany({ Report_Ids: reportId }, { $pull: { Report_Ids: reportId } });

            // Remove the report entry from the database
            await Report.findOneAndDelete({ _id: reportId });

            // Log success message
            console.log('Report and associated data deleted successfully');

            res.status(200).json({ message: 'Report and associated data deleted successfully' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/addDeletePrescriptionId', (req, res) => {
    const prescriptionId = req.body.prescriptionId;

    req.session.deletePrescriptionId = prescriptionId;

    res.status(200).json({ message: 'Prescription ID added to session successfully' });
});

router.post('/removeDeletePrescriptionId', (req, res) => {
    delete req.session.deletePrescriptionId;

    res.status(200).json({ message: 'Prescription ID removed from session successfully' });
});

router.delete('/deletePrescription', async (req, res) => {
    if (!req.session.loggedIn || !req.session.hospitalLoggedId) {
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
    }

    const prescriptionId = req.session.deletePrescriptionId;
    try {
        // Check if the prescription exists and is linked to the logged-in hospital
        const prescription = await Prescription.findOne({ _id: prescriptionId, Hospital_Id: req.session.hospitalLoggedId });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found or not authorized to delete' });
        }

        // Retrieve the Patient_Id associated with the prescription
        const patientId = prescription.Patient_Id;
        const hospitalId = req.session.hospitalLoggedId;

        // Fetch patient's information using the Patient_Id
        const patient = await PatientInfo.findById(patientId);
        if (!patient.notifications) {
            patient.notifications = [];
        }
        const patientNotificationMessage = `The prescription "${prescription.Name}" has been deleted`;
        patient.notifications.push({ message: patientNotificationMessage });
        await patient.save();

        // Fetch hospital's information using the Hospital_Id
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `The prescription "${prescription.Name}" for Patient ${patient.Name} (MediVaultId: ${patient.Medivault_Id}) has been deleted`;
        hospital.notifications.push({ message: hospitalNotificationMessage });
        await hospital.save();

        // Delete the file from the file system
        const filePath = 'public/documents/prescriptions/' + prescription.File;
        fs.unlink(filePath, async (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).json({ message: 'Error deleting file from the server' });
            }

            // Remove the prescription entry from the database
            await Prescription.findOneAndDelete({ _id: prescriptionId });

            res.status(200).json({ message: 'Prescription and associated data deleted successfully' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/addDeleteBillId', (req, res) => {
    const billId = req.body.billId;

    // Assuming you are using express-session middleware to handle sessions
    req.session.deleteBillId = billId;

    res.status(200).json({ message: 'Bill ID added to session successfully' });
});

router.post('/removeDeleteBillId', (req, res) => {
    // Assuming you are using express-session middleware to handle sessions
    delete req.session.deleteBillId;

    res.status(200).json({ message: 'Bill ID removed from session successfully' });
});

router.delete('/deleteBill', async (req, res) => {
    if (!req.session.loggedIn || !req.session.hospitalLoggedId) {
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/hospitalLogin";</script>');
    }

    const billId = req.session.deleteBillId;
    try {
        // Check if the bill exists and is linked to the logged-in hospital
        const bill = await Bills.findOne({ _id: billId, Hospital_Id: req.session.hospitalLoggedId });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found or not authorized to delete' });
        }

        // Retrieve the Patient_Id associated with the bill
        const patientId = bill.Patient_Id;
        const hospitalId = req.session.hospitalLoggedId;

        // Fetch patient's information using the Patient_Id
        const patient = await PatientInfo.findById(patientId);
        if (!patient.notifications) {
            patient.notifications = [];
        }
        const patientNotificationMessage = `The bill "${bill.Name}" has been deleted`;
        patient.notifications.push({ message: patientNotificationMessage });
        await patient.save();

        // Fetch hospital's information using the Hospital_Id
        const hospital = await HospitalInfo.findById(hospitalId);
        if (!hospital.notifications) {
            hospital.notifications = [];
        }
        const hospitalNotificationMessage = `The bill "${bill.File}" for Patient ${patient.Name} (MediVaultId: ${patient.Medivault_Id}) has been deleted`;
        hospital.notifications.push({ message: hospitalNotificationMessage });
        await hospital.save();

        // Delete the file from the file system
        const filePath = 'public/documents/bills/' + bill.File;
        fs.unlink(filePath, async (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).json({ message: 'Error deleting file from the server' });
            }

            // Remove the bill ID from associated documents
            await Prescription.updateMany({ Bills_Ids: billId }, { $pull: { Bills_Ids: billId } });

            // Remove the bill entry from the database
            await Bills.findOneAndDelete({ _id: billId });

            res.status(200).json({ message: 'Bill and associated data deleted successfully' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/readHospitalNotification', async (req, res) => {
    try {
        const { notificationId, hospitalId } = req.body;

        // Find the hospital by ID
        const hospital = await HospitalInfo.findById(hospitalId);

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        // Find the notification by ID
        const notification = hospital.Notifications.id(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Mark the notification as read
        notification.read = true;

        // Save the hospital with the updated notification
        await hospital.save();

        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/readPatientNotification', async (req, res) => {
    try {
        const { notificationId, patientId } = req.body;

        // Find the patient by ID
        const patient = await PatientInfo.findById(patientId);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Find the notification by ID
        const notification = patient.Notifications.id(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Mark the notification as read
        notification.read = true;

        // Save the patient with the updated notification
        await patient.save();

        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/patientDashboard', async (req, res) => {
    try {
        if (!req.session.medivaultId) {
            // Handle the case when medivaultId is not present
            return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
        }
        const medivaultId = req.session.medivaultId;
        // Get the patient ID from the URL parameters
        const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });
        const patientId = patientInfo._id;
        // Find all reports related to the patient using the Patient_Id
        const reports = await Report.find({ Patient_Id: patientId })
            .populate('Hospital_Id')
            .exec();

        const patientNotifications = patientInfo.Notifications || [];
        const unreadNotificationsCount = patientInfo.Notifications.filter(notification => !notification.read).length;

        res.render('patientInbox', { patientInfo: patientInfo, patientNotifications, unreadNotificationsCount });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports.router = router;
module.exports.createHospitalCodeForPatient = createHospitalCodeForPatient;
