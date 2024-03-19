// apiFunctions.js
const express = require('express');
const router = express.Router();
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const bcrypt = require('bcrypt');

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

const { sendEmail } = require('./emailFunctions');

router.use(express.json()); // This middleware will parse JSON data in the request body
router.use(cookieParser());
router.use(express.static('public'));
router.use(
    session({
        secret: 'medivault123445566', // Change this to a secure random string
        resave: false,
        saveUninitialized: true,
    })
);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/patient');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

function generateMedivaultId(firstName, lastName, phoneNumber) {
    // Extracting the first letter of the first name
    const firstLetter = firstName.charAt(0).toUpperCase();

    // Extracting the first 4 letters of the last name (or less if last name is shorter)
    const lastFourLetters = lastName.slice(0, 4).toUpperCase();

    // Extracting the last four digits of the phone number
    const lastFourDigits = extractLastFourDigits(phoneNumber);

    // Combining the components to form the 9-digit ID
    const medivaultId = firstLetter + lastFourLetters + lastFourDigits;

    return medivaultId;
}

function extractLastFourDigits(phoneNumber) {
    // Convert phone number to string if it's not already
    const phoneNumberString = phoneNumber.toString();

    // Extract the last four digits of the phone number
    const lastFourDigits = phoneNumberString.slice(-4);

    return lastFourDigits;
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

        res.render('patientReportInfo', { patientInfo: patientInfo, report_info: reports });
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

        res.render('patientAppointmentInfo', { patientInfo: patientInfo, appointment_info: appointment });
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

        res.render('patientBillInfo', { patientInfo: patientInfo, bill_info: bills });
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

        res.render('patientPrescriptionInfo', { patientInfo: patientInfo, prescription_info: prescriptions });
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

        // Render the hospital dashboard with the patients data
        res.render('hospitalDashboard', { hospital, patientData });
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

        res.render('hospitalAppointments', { hospital, appointmentInfo, patientData });
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

        res.render('hospitalCodes', { hospital, hospitalCodes, patientData });
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

        res.render('hospitalReports', { hospital, reports, patientData });
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

        res.render('hospitalBills', { hospital, bills, patientData });
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/hospitalDashboard/prescriptions', async (req, res) => {
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

        res.render('hospitalPrescriptions', { hospital, prescriptions, patientData });
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


        const { _id, updatedData } = req.body;
        console.log('Updating patient:', _id, updatedData);

        // Convert formatted data back to original structure
        const originalDataAgain = convertToOriginalData(updatedData);

        // Update the patient information in the database
        await PatientInfo.findByIdAndUpdate(
            _id,
            { $set: originalDataAgain },
            { new: true } // Return the updated document
        );

        console.log('Patient updated successfully');
        res.sendStatus(200); // Send a simple 200 OK response
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

router.post('/patientCreate', async (req, res) => {
    try {
        const { newData } = req.body; // Assuming newData contains the information for the new patient
        console.log("New Patient Info Server", newData);
        // Convert formatted data to the structure expected by your model
        const formattedData = convertToOriginalData(newData, true);

        // Create a new patient entry in the database
        await PatientInfo.create(formattedData);

        console.log('Patient created successfully');
        res.sendStatus(201); // Send a 201 Created response
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

function convertToOriginalData(formattedData, isCreating = false) {
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

router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.session.medivaultId) {
        // Handle the case when medivaultId is not present
        return res.status(401).send('<script>alert("Please log in first"); window.location.href="/patientLogin";</script>');
    }
    console.log('Request received:', req.file);

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

    console.log('File uploaded successfully:', req.file);
    res.status(200).json({ message: 'File uploaded successfully' });
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

        const patientId = patientInfo._id;
        const hospitalId = req.session.hospitalId;
        const reportId = req.session.reportId; // Assuming you have the reportId stored in the session

        //Reset
        req.session.reportId = '';
        req.session.hospitalId = '';

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

        const patientId = patientInfo._id;
        const hospitalId = req.session.hospitalId;
        const prescriptionId = req.session.prescriptionId; // Assuming you have the prescriptionId stored in the session

        //Reset
        req.session.prescriptionId = '';
        req.session.hospitalId = '';

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

        const patientId = patientInfo._id;
        const hospitalId = req.session.hospitalId;
        const billId = req.session.billId; // Assuming you have the reportId stored in the session

        //Reset
        req.session.billId = '';
        req.session.hospitalId = '';

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
        sendEmail(email, `Your hospital code is: ${hospitalCode}`);

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

module.exports = router;
