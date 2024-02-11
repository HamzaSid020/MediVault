const express = require('express');
const app = express();
const { 
  connectToDatabase, 
  createModels,
  HospitalInfo,
  PatientInfo,
  Report,
  Bills,
  Prescription,
  PatientLogin,
  HospitalLogin,
  HospitalCodes, } = require('./database/models');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const apiFunctions = require('./database/apiFunctions');
const ejs = require('ejs');
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api', apiFunctions);

app.get('/', async (req, res) => {
  try {
    const hospitals = await HospitalInfo.find();
    const patients = await PatientInfo.find();
    const reports = await Report.find();
    const bills = await Bills.find();
    const prescriptions = await Prescription.find();
    const patientLogins = await PatientLogin.find();
    const hospitalLogins = await HospitalLogin.find();
    const hospitalCodes = await HospitalCodes.find();

    res.render('index', { hospitals, patients, reports, bills, prescriptions, patientLogins, hospitalLogins, hospitalCodes });
  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Connect to the database and create models
connectToDatabase()
  .then(createModels)
  .then(() => {
    seedDatabase();
    // Start your Express app
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch(error => {
    console.error('Error starting the application:', error);
  });

// Function to seed the database with dummy data
async function seedDatabase() {
  try {
    // Add dummy data for Hospital_Info
    await addDummyHospitals();

    // Add dummy data for Patient_Info
    await addDummyPatients();

    // Add dummy data for Report
    await addDummyReports();

    // Add dummy data for Bills
    await addDummyBills();

    // Add dummy data for Prescription
    await addDummyPrescriptions();

    // Add dummy data for Patient_Login
    await addDummyPatientLogins();

    // Add dummy data for Hospital_Login
    await addDummyHospitalLogins();

    // Add dummy data for Hospital_Codes
    await addDummyHospitalCodes();

    console.log('Dummy data added to the database');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Add dummy data for Hospital_Info
async function addDummyHospitals() {
  const existingHospitals = await HospitalInfo.find({});

  if (existingHospitals.length === 0) {
    const dummyHospitals = [
      {
        Name: 'Hospital A',
        Description: 'A description for Hospital A',
        Picture: 'hospital_a.jpg',
      },
      {
        Name: 'Hospital B',
        Description: 'A description for Hospital B',
        Picture: 'hospital_b.jpg',
      },
    ];

    await HospitalInfo.insertMany(dummyHospitals);
    console.log('Dummy data added for Hospital_Info');
  } else {
    console.log('Dummy data for Hospital_Info already exists');
  }
}

async function addDummyPatients() {
  const existingPatients = await PatientInfo.find({});

  if (existingPatients.length === 0) {
    // Find Hospital_Info IDs by name
    const hospitalA_Id = await HospitalInfo.findOne({ Name: 'Hospital A' }).select('_id');
    const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');

    const dummyPatients = [
      {
        Name: 'Patient 1',
        Phone_No: '1234567890',
        Email: 'patient1@example.com',
        Picture: 'patient1.jpg',
        Hospital_Ids: [hospitalA_Id],
      },
      {
        Name: 'Patient 2',
        Phone_No: '9876543210',
        Email: 'patient2@example.com',
        Picture: 'patient2.jpg',
        Hospital_Ids: [hospitalB_Id],
      },
      // Add more entries as needed
    ];

    await PatientInfo.insertMany(dummyPatients);
    console.log('Dummy data added for Patient_Info');
  } else {
    console.log('Dummy data for Patient_Info already exists');
  }
}

// Add dummy data for Report
async function addDummyReports() {
  const existingReports = await Report.find({});

  if (existingReports.length === 0) {
    // Find Hospital_Info and Patient_Info IDs by name
    const hospitalA_Id = await HospitalInfo.findOne({ Name: 'Hospital A' }).select('_id');
    const patient1_Id = await PatientInfo.findOne({ Name: 'Patient 1' }).select('_id');

    const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
    const patient2_Id = await PatientInfo.findOne({ Name: 'Patient 2' }).select('_id');

    const dummyReports = [
      {
        Category: 'Test',
        Name: 'Report 1',
        Patient_Id: patient1_Id, // Reference to Patient_Info ID
        Hospital_Id: hospitalA_Id, // Reference to Hospital_Info ID
      },
      {
        Category: 'Test',
        Name: 'Report 2',
        Patient_Id: patient2_Id, // Reference to Patient_Info ID
        Hospital_Id: hospitalB_Id, // Reference to Hospital_Info ID
      },
      // Add more entries as needed
    ];

    await Report.insertMany(dummyReports);
    console.log('Dummy data added for Report');
  } else {
    console.log('Dummy data for Report already exists');
  }
}

// Add dummy data for Bills
async function addDummyBills() {
  const existingBills = await Bills.find({});

  if (existingBills.length === 0) {
    const hospitalA_Id = await HospitalInfo.findOne({ Name: 'Hospital A' }).select('_id');
    const patient1_Id = await PatientInfo.findOne({ Name: 'Patient 1' }).select('_id');
    const report1_Id = await Report.findOne({ Name: 'Report 1' }).select('_id');

    const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
    const patient2_Id = await PatientInfo.findOne({ Name: 'Patient 2' }).select('_id');
    const report2_Id = await Report.findOne({ Name: 'Report 2' }).select('_id');

    const dummyBills = [
      {
        Category: 'Medical',
        Name: 'Bill 1',
        File: 'bill1.pdf',
        Hospital_Id: hospitalA_Id, // Reference to Hospital_Info ID
        Patient_Id: patient1_Id, // Reference to Patient_Info ID
        Report_Ids: [report1_Id], // Reference to Report ID
      },
      {
        Category: 'Medical',
        Name: 'Bill 2',
        File: 'bill2.pdf',
        Hospital_Id: hospitalB_Id, // Reference to Hospital_Info ID
        Patient_Id: patient2_Id, // Reference to Patient_Info ID
        Report_Ids: [report2_Id], // Reference to Report ID
      },
    ];

    await Bills.insertMany(dummyBills);
    console.log('Dummy data added for Bills');
  } else {
    console.log('Dummy data for Bills already exists');
  }
}

// Add dummy data for Prescription
async function addDummyPrescriptions() {
  const existingPrescriptions = await Prescription.find({});

  if (existingPrescriptions.length === 0) {
    const hospitalA_Id = await HospitalInfo.findOne({ Name: 'Hospital A' }).select('_id');
    const patient1_Id = await PatientInfo.findOne({ Name: 'Patient 1' }).select('_id');
    const report1_Id = await Report.findOne({ Name: 'Report 1' }).select('_id');
    const bill1_Id = await Bills.findOne({ Name: 'Bill 1' }).select('_id');

    const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
    const patient2_Id = await PatientInfo.findOne({ Name: 'Patient 2' }).select('_id');
    const report2_Id = await Report.findOne({ Name: 'Report 2' }).select('_id');
    const bill2_Id = await Bills.findOne({ Name: 'Bill 2' }).select('_id');

    const dummyPrescriptions = [
      {
        Name: 'Prescription 1',
        File: 'prescription1.pdf',
        Hospital_Id: hospitalA_Id, // Reference to Hospital_Info ID
        Patient_Id: patient1_Id, // Reference to Patient_Info ID
        Report_Ids: [report1_Id], // Reference to Report ID
        Bills_Ids: [bill1_Id], // Reference to Bills ID
      },
      {
        Name: 'Prescription 2',
        File: 'prescription2.pdf',
        Hospital_Id: hospitalB_Id, // Reference to Hospital_Info ID
        Patient_Id: patient2_Id, // Reference to Patient_Info ID
        Report_Ids: [report2_Id], // Reference to Report ID
        Bills_Ids: [bill2_Id], // Reference to Bills ID
      },
    ];

    await Prescription.insertMany(dummyPrescriptions);
    console.log('Dummy data added for Prescription');
  } else {
    console.log('Dummy data for Prescription already exists');
  }
}

// Add dummy data for Patient_Login
async function addDummyPatientLogins() {
  const existingPatientLogins = await PatientLogin.find({});

  if (existingPatientLogins.length === 0) {
    const patient1_Id = await PatientInfo.findOne({ Name: 'Patient 1' }).select('_id');
    const patient2_Id = await PatientInfo.findOne({ Name: 'Patient 2' }).select('_id');

    const dummyPatientLogins = [
      {
        Username: 'hamza',
        Password: '123',
        Patient_Id: patient1_Id, // Reference to Patient_Info ID
      },
      {
        Username: 'nidhi',
        Password: '123',
        Patient_Id: patient2_Id, // Reference to Patient_Info ID
      },
    ];

    await PatientLogin.insertMany(dummyPatientLogins);
    console.log('Dummy data added for Patient_Login');
  } else {
    console.log('Dummy data for Patient_Login already exists');
  }
}

// Add dummy data for Hospital_Login
async function addDummyHospitalLogins() {
  const existingHospitalLogins = await HospitalLogin.find({});

  if (existingHospitalLogins.length === 0) {
    const hospitalA_Id = await HospitalInfo.findOne({ Name: 'Hospital A' }).select('_id');
    const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');

    const dummyHospitalLogins = [
      {
        Username: 'hamza',
        Password: '123',
        Hospital_Id: hospitalA_Id, // Reference to Hospital_Info ID
      },
      {
        Username: 'nidhi',
        Password: '123',
        Hospital_Id: hospitalB_Id, // Reference to Hospital_Info ID
      },
    ];

    await HospitalLogin.insertMany(dummyHospitalLogins);
    console.log('Dummy data added for Hospital_Login');
  } else {
    console.log('Dummy data for Hospital_Login already exists');
  }
}

// Add dummy data for Hospital_Codes
async function addDummyHospitalCodes() {
  const existingHospitalCodes = await HospitalCodes.find({});

  if (existingHospitalCodes.length === 0) {
    const hospitalA_Id = await HospitalInfo.findOne({ Name: 'Hospital A' }).select('_id');
    const patient1_Id = await PatientInfo.findOne({ Name: 'Patient 1' }).select('_id');

    const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
    const patient2_Id = await PatientInfo.findOne({ Name: 'Patient 2' }).select('_id');
    const dummyHospitalCodes = [
      {
        Code: '123456',
        Patient_Id: patient1_Id, // Reference to Patient_Info ID
        Hospital_Id: hospitalA_Id, // Reference to Hospital_Info ID
      },
      {
        Code: 'ABCDEF',
        Patient_Id: patient2_Id, // Reference to Patient_Info ID
        Hospital_Id: hospitalB_Id, // Reference to Hospital_Info ID
      },
    ];

    await HospitalCodes.insertMany(dummyHospitalCodes);
    console.log('Dummy data added for Hospital_Codes');
  } else {
    console.log('Dummy data for Hospital_Codes already exists');
  }
}