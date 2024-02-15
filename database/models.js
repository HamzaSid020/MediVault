// models.js
const mongoose = require('mongoose');

const HospitalInfoSchema = new mongoose.Schema({
    Name: String,
    Description: String,
    Picture: String,
});

const PatientInfoSchema = new mongoose.Schema({
    Name: String,
    Phone_No: String,
    Age: Number,
    DOB: String,
    Sex: String,
    Address: String,
    Email: String,
    Picture: String,
    Medivault_Id: String,
    Hospital_Ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' }],
});

const ReportSchema = new mongoose.Schema({
    Category: String,
    Name: String,
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
});

const BillsSchema = new mongoose.Schema({
    Category: String,
    Name: String,
    File: String,
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
    Report_Ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
});

const PrescriptionSchema = new mongoose.Schema({
    Name: String,
    File: String,
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
    Report_Ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
    Bills_Ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bills' }],
});

const PatientLoginSchema = new mongoose.Schema({
    Username: String,
    Password: String,
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
});

const HospitalLoginSchema = new mongoose.Schema({
    Username: String,
    Password: String,
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
});

const HospitalCodesSchema = new mongoose.Schema({
    Code: String,
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
});

const HospitalInfo = mongoose.model('Hospital_Info', HospitalInfoSchema);
const PatientInfo = mongoose.model('Patient_Info', PatientInfoSchema);
const Report = mongoose.model('Report', ReportSchema);
const Bills = mongoose.model('Bills', BillsSchema);
const Prescription = mongoose.model('Prescription', PrescriptionSchema);
const PatientLogin = mongoose.model('Patient_Login', PatientLoginSchema);
const HospitalLogin = mongoose.model('Hospital_Login', HospitalLoginSchema);
const HospitalCodes = mongoose.model('Hospital_Codes', HospitalCodesSchema);

async function createModels() {
    try {
        // Check if models exist in the database
        const hospitalInfoCount = await HospitalInfo.countDocuments();
        // Check other models similarly...

        // If models don't exist, create them
        if (hospitalInfoCount === 0) {
            await HospitalInfo.createCollection();
            // Create other collections similarly...
            console.log('Models created successfully');
        } else {
            console.log('Models already exist in the database');
        }
    } catch (error) {
        console.error('Error creating models:', error);
    }
}

module.exports = {
    createModels,
    HospitalInfo,
    PatientInfo,
    Report,
    Bills,
    Prescription,
    PatientLogin,
    HospitalLogin,
    HospitalCodes,
};
