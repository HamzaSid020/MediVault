// apiFunctions.js
const express = require('express');
const router = express.Router();
const path = require('path');
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
} = require('./models');

router.use(express.json()); // This middleware will parse JSON data in the request body
router.post('/patient-login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Received request:', username, password); // Check if request body is received correctly

    try {
        const user = await PatientLogin.findOne({ Username: username, Password: password });
        console.log('User:', user); // Check if user is found

        if (user) {
            const patientInfo = await PatientInfo.findOne({ _id: user.Patient_Id }).select('Medivault_Id');
            console.log('Patient Info:', patientInfo); // Check if patient information is found

            if (patientInfo) {
                res.status(200).json({ message: 'Login successful', medivaultId: patientInfo.Medivault_Id });
            } else {
                res.status(500).json({ message: 'Patient information not found' });
            }
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error:', error); // Log the error for debugging
        res.status(500).json({ error: error.message });
    }
});
router.post('/hospital-login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Received request:', username, password); // Check if request body is received correctly

    try {
        const user = await HospitalLogin.findOne({ Username: username, Password: password });
        console.log('User:', user); // Check if user is found

        if (user) {
            const hospitalInfo = await HospitalInfo.findOne({ _id: user.Hospital_Id });
            console.log('Hospital Info:', hospitalInfo); // Check if patient information is found

            if (hospitalInfo) {
                res.status(200).json({ message: 'Login successful', hospitalId: hospitalInfo._id });
            } else {
                res.status(500).json({ message: 'Patient information not found' });
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

        res.render('patientRegistration');
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

router.get('/patientReport/:medivaultId', async (req, res) => {
    try {
        // Get the patient ID from the URL parameters
        const medivaultId = req.params.medivaultId;
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

router.get('/patientAppointment/:medivaultId', async (req, res) => {
    try {
        // Get the patient ID from the URL parameters
        const medivaultId = req.params.medivaultId;
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

router.get('/patientBill/:medivaultId', async (req, res) => {
    try {
        // Get the patient ID from the URL parameters
        const medivaultId = req.params.medivaultId;
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

router.get('/patientPrescription/:medivaultId', async (req, res) => {
    try {
        // Get the patient ID from the URL parameters
        const medivaultId = req.params.medivaultId;
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

router.get('/hospitalDashboard/patients/:hospitalId', async (req, res) => {
    try {
        const hospitalId = req.params.hospitalId;

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

module.exports = router;
