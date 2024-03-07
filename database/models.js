// models.js
const mongoose = require('mongoose');

const HospitalInfoSchema = new mongoose.Schema({
    Name: String,
    Phone_No: String,
    License_No: String,
    Description: String,
    Address: String,
    Picture: String,
    Last_Updated_Time: { type: Date, default: Date.now }
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
    Patient_Id: String,
    Medivault_Id: String,
    Hospital_Ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' }],
    Last_Updated_Time: { type: Date, default: Date.now }
});

const ReportSchema = new mongoose.Schema({
    Category: String,
    Name: String,
    File: String,
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
    Last_Updated_Time: { type: Date, default: Date.now }
});

const BillsSchema = new mongoose.Schema({
    Category: String,
    Name: String,
    File: String,
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
    Report_Ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
    Last_Updated_Time: { type: Date, default: Date.now }
});

const AppointmentSchema = new mongoose.Schema({
    Doctor_Name: String,
    Appointment_Date: Date,
    Appointment_Type: String,
    Notes: String,
    Status: String,
    Created_Time: { type: Date, default: Date.now },
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
    Last_Updated_Time: { type: Date, default: Date.now }
});

const PrescriptionSchema = new mongoose.Schema({
    Name: String,
    File: String,
    Hospital_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital_Info' },
    Patient_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient_Info' },
    Report_Ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
    Bills_Ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bills' }],
    Last_Updated_Time: { type: Date, default: Date.now }
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
const Appointment = mongoose.model('Appointment', AppointmentSchema);
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
    Appointment,
    PatientLogin,
    HospitalLogin,
    HospitalCodes,
};
