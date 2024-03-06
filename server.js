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
    addDummyAppointments,
}  = require('./database/dummyData');

const express = require('express');
const app = express();
const apiFunctions = require('./database/apiFunctions');
const mongoose = require('mongoose');
const ejs = require('ejs');
const path = require('path');
const fileUpload = require('express-fileupload');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); // Parse incoming requests with urlencoded payloads
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

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

app.use('/', apiFunctions);

app.get('/', async (req, res) => {
  try {
    res.render('home');
  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/uploadPatientImage', (req, res) => {
  // Check if the request has files
  if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
  }

  const uploadedFile = req.files.patientImage; // 'patientImage' is the name attribute in the form input

  // Specify the destination path
  const destinationPath = path.join(__dirname, 'public/images/patient');
  console.log( "destinationPath", destinationPath );
  // Use the mv() method to move the file to the specified path
  uploadedFile.mv(path.join(destinationPath, uploadedFile.name), (err) => {
      if (err) {
          return res.status(500).send(err);
      }

      // Return a response with the file details
      res.send({
          filename: uploadedFile.name,
          path: path.join(destinationPath, uploadedFile.name)
      });
  });
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

    // Add dummy data for Appointments
    await addDummyAppointments();

    console.log('Dummy data added to the database');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}