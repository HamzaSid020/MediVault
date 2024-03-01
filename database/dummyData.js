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


function generateMedivaultId(firstName, lastName) {
    // Extracting the first letter of the first name
    const firstLetter = firstName.charAt(0).toUpperCase();
  
    // Extracting the first 4 letters of the last name (or less if last name is shorter)
    const lastFourLetters = lastName.slice(0, 4).toUpperCase();
  
    // Generating a random 4-digit number
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
  
    // Combining the components to form the 9-digit ID
    const medivaultId = firstLetter + lastFourLetters + randomDigits;
  
    return medivaultId;
  }
  
  function calculateAge(birthDate) {
    // Split the date string into day, month, and year
    const [day, month, year] = birthDate.split('-').map(Number);
    
    // Create a Date object with the provided values
    const birthDateObject = new Date(year, month - 1, day);
    
    // Get the current date
    const currentDate = new Date();
    
    // Calculate the difference in years
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
        {
          Name: 'Hospital C',
          Description: 'A description for Hospital C',
          Picture: 'hospital_C.jpg',
        },
      ];
  
      await HospitalInfo.insertMany(dummyHospitals);
      console.log('Dummy data added for Hospital_Info');
    }}

    
async function addDummyPatients() {
    const existingPatients = await PatientInfo.find({});
  
    if (existingPatients.length === 0) {
      // Find Hospital_Info IDs by name
      const hospitalA_Id = await HospitalInfo.findOne({ Name: 'Hospital A' }).select('_id');
      const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
      const hospitalC_Id = await HospitalInfo.findOne({ Name: 'Hospital C' }).select('_id');
  
      const dummyPatients = [
        {
          Name: 'Hamza Siddiqui',
          Phone_No: '1234567890',
          Email: 'patient1@example.com',
          DOB: '24-06-2000',
          Age: calculateAge('24-06-2000'),
          Sex: 'M',
          Address: '123 Havelwood Cresent, Waterloo, ON N2L 4L2',
          Picture: 'patient1.jpg',
          Medivault_Id: generateMedivaultId('Hamza', 'Siddiqui'),
          Hospital_Ids: [hospitalA_Id,hospitalC_Id],
        },
        {
          Name: 'Nidhi Shukla',
          Phone_No: '9876543210',
          Email: 'patient2@example.com',
          DOB: '11-09-2006',
          Age: calculateAge('11-09-2006'),
          Sex: 'F',
          Address: '1567 Albert Street, Waterloo, ON N2L 4L2',
          Picture: 'patient2.jpg',
          Medivault_Id: generateMedivaultId('Nidhi', 'Shukla'),
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
      const hospitalC_Id = await HospitalInfo.findOne({ Name: 'Hospital C' }).select('_id');
      const patient1_Id = await PatientInfo.findOne({ Name: 'Hamza Siddiqui' }).select('_id');
  
      const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
      const patient2_Id = await PatientInfo.findOne({ Name: 'Nidhi Shukla' }).select('_id');
  
      const dummyReports = [
        {
          Category: 'Test',
          Name: 'Report 1',
          File: 'Report1.pdf',
          Patient_Id: patient1_Id, // Reference to Patient_Info ID
          Hospital_Id: hospitalA_Id, // Reference to Hospital_Info ID
        },
        {
          Category: 'Test',
          Name: 'Report 2',
          File: 'Report2.pdf',
          Patient_Id: patient2_Id, // Reference to Patient_Info ID
          Hospital_Id: hospitalB_Id, // Reference to Hospital_Info ID
        },
        {
          Category: 'Test',
          Name: 'Report 3',
          File: 'Report3.pdf',
          Patient_Id: patient1_Id, // Reference to Patient_Info ID
          Hospital_Id: hospitalC_Id, // Reference to Hospital_Info ID
        },
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
      const patient1_Id = await PatientInfo.findOne({ Name: 'Hamza Siddiqui' }).select('_id');
      const report1_Id = await Report.findOne({ Name: 'Report 1' }).select('_id');
  
      const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
      const patient2_Id = await PatientInfo.findOne({ Name: 'Nidhi Shukla' }).select('_id');
      const report2_Id = await Report.findOne({ Name: 'Report 2' }).select('_id');

      const hospitalC_Id = await HospitalInfo.findOne({ Name: 'Hospital C' }).select('_id');
      const patient3_Id = await PatientInfo.findOne({ Name: 'Hamza Siddiqui' }).select('_id');
      const report3_Id = await Report.findOne({ Name: 'Report 1' }).select('_id');
  
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
        {
          Category: 'Medical',
          Name: 'Bill 3',
          File: 'bill3.pdf',
          Hospital_Id: hospitalC_Id, // Reference to Hospital_Info ID
          Patient_Id: patient3_Id, // Reference to Patient_Info ID
          Report_Ids: [report3_Id], // Reference to Report ID
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
      const patient1_Id = await PatientInfo.findOne({ Name: 'Hamza Siddiqui' }).select('_id');
      const report1_Id = await Report.findOne({ Name: 'Report 1' }).select('_id');
      const bill1_Id = await Bills.findOne({ Name: 'Bill 1' }).select('_id');
  
      const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
      const patient2_Id = await PatientInfo.findOne({ Name: 'Nidhi Shukla' }).select('_id');
      const report2_Id = await Report.findOne({ Name: 'Report 2' }).select('_id');
      const bill2_Id = await Bills.findOne({ Name: 'Bill 2' }).select('_id');
  
  
      const hospitalC_Id = await HospitalInfo.findOne({ Name: 'Hospital C' }).select('_id');
      const patient3_Id = await PatientInfo.findOne({ Name: 'Hamza Siddiqui' }).select('_id');
      const report3_Id = await Report.findOne({ Name: 'Report 1' }).select('_id');
      const bill3_Id = await Bills.findOne({ Name: 'Bill 1' }).select('_id');
  
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
        {
          Name: 'Prescription 3',
          File: 'prescription3.pdf',
          Hospital_Id: hospitalC_Id, // Reference to Hospital_Info ID
          Patient_Id: patient3_Id, // Reference to Patient_Info ID
          Report_Ids: [report3_Id], // Reference to Report ID
          Bills_Ids: [bill3_Id], // Reference to Bills ID
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
      const patient1_Id = await PatientInfo.findOne({ Name: 'Hamza Siddiqui' }).select('_id');
      const patient2_Id = await PatientInfo.findOne({ Name: 'Nidhi Shukla' }).select('_id');
  
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
      console.log('Dummy data for Patient Login already exists');
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

  module.exports = {
    addDummyHospitals,
    addDummyPatients,
    addDummyReports,
    addDummyBills,
    addDummyPrescriptions,
    addDummyPatientLogins,
    addDummyHospitalLogins,
    addDummyHospitalCodes,
};
