require('dotenv').config();

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
const apiFunctions = require('./database/apiFunctions').router;
const mongoose = require('mongoose');
const ejs = require('ejs');
const path = require('path');
const base = "https://api-m.sandbox.paypal.com";

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); // Parse incoming requests with urlencoded payloads

app.use(express.json()); // This middleware will parse JSON data in the request body
app.use(express.static(path.join(__dirname, 'public')));

async function connectToDatabase() {
  try {
      await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
  } catch (error) {
      console.error('Error connecting to MongoDB:', error);
  }
}

app.use('/', apiFunctions);

// Connect to the database and create models
connectToDatabase()
  .then(createModels)
  .then(() => {
    seedDatabase();
    // Start your Express app
    app.listen(process.env.PORT, () => {
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