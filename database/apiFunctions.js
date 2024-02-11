// apiFunctions.js
const express = require('express');
const router = express.Router();
const {
    HospitalInfo,
    PatientInfo,
    Report,
    Bills,
    Prescription,
    PatientLogin,
    HospitalLogin,
    HospitalCodes,
} = require('./models');

// Hospital_Info
router.post('/hospitals', async (req, res) => {
    try {
        const hospital = new HospitalInfo(req.body);
        await hospital.save();
        res.status(201).json(hospital);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/hospitals', async (req, res) => {
    try {
        const hospitals = await HospitalInfo.find({});
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/hospitals/:id', async (req, res) => {
    try {
        const hospital = await HospitalInfo.findById(req.params.id);
        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' });
        }
        res.json(hospital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/hospitals/:id', async (req, res) => {
    try {
        const hospital = await HospitalInfo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' });
        }
        res.json(hospital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/hospitals/:id', async (req, res) => {
    try {
        const hospital = await HospitalInfo.findByIdAndDelete(req.params.id);
        if (!hospital) {
            return res.status(404).json({ error: 'Hospital not found' });
        }
        res.json({ message: 'Hospital deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient_Info
router.post('/patients', async (req, res) => {
    try {
        const patient = new PatientInfo(req.body);
        await patient.save();
        res.status(201).json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/patients', async (req, res) => {
    try {
        const patients = await PatientInfo.find({});
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/patients/:id', async (req, res) => {
    try {
        const patient = await PatientInfo.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/patients/:id', async (req, res) => {
    try {
        const patient = await PatientInfo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/patients/:id', async (req, res) => {
    try {
        const patient = await PatientInfo.findByIdAndDelete(req.params.id);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Report
router.post('/reports', async (req, res) => {
    try {
        const report = new Report(req.body);
        await report.save();
        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/reports', async (req, res) => {
    try {
        const reports = await Report.find({});
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/reports/:id', async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/reports/:id', async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/reports/:id', async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bills
router.post('/bills', async (req, res) => {
    try {
        const bills = new Bills(req.body);
        await bills.save();
        res.status(201).json(bills);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/bills', async (req, res) => {
    try {
        const bills = await Bills.find({});
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/bills/:id', async (req, res) => {
    try {
        const bills = await Bills.findById(req.params.id);
        if (!bills) {
            return res.status(404).json({ error: 'Bills not found' });
        }
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/bills/:id', async (req, res) => {
    try {
        const bills = await Bills.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bills) {
            return res.status(404).json({ error: 'Bills not found' });
        }
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/bills/:id', async (req, res) => {
    try {
        const bills = await Bills.findByIdAndDelete(req.params.id);
        if (!bills) {
            return res.status(404).json({ error: 'Bills not found' });
        }
        res.json({ message: 'Bills deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Prescription
router.post('/prescriptions', async (req, res) => {
    try {
        const prescription = new Prescription(req.body);
        await prescription.save();
        res.status(201).json(prescription);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/prescriptions', async (req, res) => {
    try {
        const prescriptions = await Prescription.find({});
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/prescriptions/:id', async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);
        if (!prescription) {
            return res.status(404).json({ error: 'Prescription not found' });
        }
        res.json(prescription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/prescriptions/:id', async (req, res) => {
    try {
        const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!prescription) {
            return res.status(404).json({ error: 'Prescription not found' });
        }
        res.json(prescription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/prescriptions/:id', async (req, res) => {
    try {
        const prescription = await Prescription.findByIdAndDelete(req.params.id);
        if (!prescription) {
            return res.status(404).json({ error: 'Prescription not found' });
        }
        res.json({ message: 'Prescription deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Patient_Login
router.post('/patient-logins', async (req, res) => {
    try {
        const patientLogin = new PatientLogin(req.body);
        await patientLogin.save();
        res.status(201).json(patientLogin);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/patient-logins', async (req, res) => {
    try {
        const patientLogins = await PatientLogin.find({});
        res.json(patientLogins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/patient-logins/:id', async (req, res) => {
    try {
        const patientLogin = await PatientLogin.findById(req.params.id);
        if (!patientLogin) {
            return res.status(404).json({ error: 'Patient Login not found' });
        }
        res.json(patientLogin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/patient-logins/:id', async (req, res) => {
    try {
        const patientLogin = await PatientLogin.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!patientLogin) {
            return res.status(404).json({ error: 'Patient Login not found' });
        }
        res.json(patientLogin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/patient-logins/:id', async (req, res) => {
    try {
        const patientLogin = await PatientLogin.findByIdAndDelete(req.params.id);
        if (!patientLogin) {
            return res.status(404).json({ error: 'Patient Login not found' });
        }
        res.json({ message: 'Patient Login deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Hospital_Login
router.post('/hospital-logins', async (req, res) => {
    try {
        const hospitalLogin = new HospitalLogin(req.body);
        await hospitalLogin.save();
        res.status(201).json(hospitalLogin);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/hospital-logins', async (req, res) => {
    try {
        const hospitalLogins = await HospitalLogin.find({});
        res.json(hospitalLogins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/hospital-logins/:id', async (req, res) => {
    try {
        const hospitalLogin = await HospitalLogin.findById(req.params.id);
        if (!hospitalLogin) {
            return res.status(404).json({ error: 'Hospital Login not found' });
        }
        res.json(hospitalLogin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/hospital-logins/:id', async (req, res) => {
    try {
        const hospitalLogin = await HospitalLogin.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hospitalLogin) {
            return res.status(404).json({ error: 'Hospital Login not found' });
        }
        res.json(hospitalLogin);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/hospital-logins/:id', async (req, res) => {
    try {
        const hospitalLogin = await HospitalLogin.findByIdAndDelete(req.params.id);
        if (!hospitalLogin) {
            return res.status(404).json({ error: 'Hospital Login not found' });
        }
        res.json({ message: 'Hospital Login deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Hospital_Codes
router.post('/hospital-codes', async (req, res) => {
    try {
        const hospitalCode = new HospitalCodes(req.body);
        await hospitalCode.save();
        res.status(201).json(hospitalCode);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/hospital-codes', async (req, res) => {
    try {
        const hospitalCodes = await HospitalCodes.find({});
        res.json(hospitalCodes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/hospital-codes/:id', async (req, res) => {
    try {
        const hospitalCode = await HospitalCodes.findById(req.params.id);
        if (!hospitalCode) {
            return res.status(404).json({ error: 'Hospital Code not found' });
        }
        res.json(hospitalCode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/hospital-codes/:id', async (req, res) => {
    try {
        const hospitalCode = await HospitalCodes.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hospitalCode) {
            return res.status(404).json({ error: 'Hospital Code not found' });
        }
        res.json(hospitalCode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/hospital-codes/:id', async (req, res) => {
    try {
        const hospitalCode = await HospitalCodes.findByIdAndDelete(req.params.id);
        if (!hospitalCode) {
            return res.status(404).json({ error: 'Hospital Code not found' });
        }
        res.json({ message: 'Hospital Code deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
