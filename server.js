const { 
  createModels,
  HospitalInfo,
  PatientInfo,
  Report,
  Bills,
  Prescription,
  PatientLogin,
  HospitalLogin,
  HospitalCodes, } = require('./database/models');
 const {
    addDummyHospitals,
    addDummyPatients,
    addDummyReports,
    addDummyBills,
    addDummyPrescriptions,
    addDummyPatientLogins,
    addDummyHospitalLogins,
    addDummyHospitalCodes,
}  = require('./database/dummyData');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const apiFunctions = require('./database/apiFunctions');
const mongoose = require('mongoose');
const ejs = require('ejs');
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function connectToDatabase() {
  try {
      await mongoose.connect('mongodb://localhost:27017/mediVault', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
  } catch (error) {
      console.error('Error connecting to MongoDB:', error);
  }
}

app.use('', apiFunctions);

app.get('/', async (req, res) => {
  try {
    res.render('home');
  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/database', async (req, res) => {
  try {
    const hospitals = await HospitalInfo.find();
    const patients = await PatientInfo.find();
    const reports = await Report.find();
    const bills = await Bills.find();
    const prescriptions = await Prescription.find();
    const patientLogins = await PatientLogin.find();
    const hospitalLogins = await HospitalLogin.find();
    const hospitalCodes = await HospitalCodes.find();

    res.render('adminDashboard', { hospitals, patients, reports, bills, prescriptions, patientLogins, hospitalLogins, hospitalCodes });
  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/patientLogin', async (req, res) => {
  try {
   
    res.render('patientLogin');
  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/patientInfo/:medivaultId', async (req, res) => {
  try {
    // Get the patient ID from the URL parameters
    const medivaultId = req.params.medivaultId;
    const patientInfo = await PatientInfo.findOne({ Medivault_Id: medivaultId });

    // Pass the patient ID to the render function
    res.render('patientInfo', { patientInfo: patientInfo });
  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/hospitalLogin', async (req, res) => {
  try {
   
    res.render('hospitalLogin');
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
