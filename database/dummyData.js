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

const createHospitalCodeForPatient = require('./apiFunctions').createHospitalCodeForPatient;

const bcrypt = require('bcrypt');

async function hashPassword(plainTextPassword) {
  return new Promise((resolve, reject) => {
      const saltRounds = 10; // The higher the rounds, the more secure but slower the hashing
      bcrypt.genSalt(saltRounds, function(err, salt) {
          if (err) {
              reject(err);
          } else {
              bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                  if (err) {
                      reject(err);
                  } else {
                      resolve(hash);
                  }
              });
          }
      });
  });
}

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

function calculateAge(birthDate) {
  // Split the date string into day, month, and year
  const [year, month, day ] = birthDate.split('-').map(Number);

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
  }
}


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
        DOB: '2000-06-24',
        DOB: '2000-06-24',
        OHIP_Number:'1234-567-891-AB',
        Age: calculateAge('2000-06-24'),
        Sex: 'M',
        Address: '123 Havelwood Cresent, Waterloo, ON N2L 4L2',
        Picture: 'patient1.jpg',
        Patient_Id: '12345',
        Medivault_Id: generateMedivaultId('Hamza', 'Siddiqui','1234567890'),
        Hospital_Ids: [hospitalA_Id, hospitalC_Id],
      },
      {
        Name: 'Vaishnavi Polina',
        Phone_No: '1234554855',
        Email: 'patient12@example.com',
        DOB: '1999-10-10',
        OHIP_Number:'2345-678-912-CD',
        Age: calculateAge('1999-10-10'),
        Sex: 'F',
        Address: '123 Havelwood Cresent, Waterloo, ON N2L 4L2',
        Picture: 'patient3.jpg',
        Patient_Id: '56458',
        Medivault_Id: generateMedivaultId('Vaishnavi', 'Polina','1234554855'),
        Hospital_Ids: [hospitalA_Id, hospitalB_Id],
      },
      {
        Name: 'Nidhi Shukla',
        Phone_No: '9876543210',
        Email: 'patient2@example.com',
        DOB: '2006-09-11',
        OHIP_Number:'3456-789-123-EF',
        Age: calculateAge('2006-09-11'),
        Sex: 'F',
        Address: '1567 Albert Street, Waterloo, ON N2L 4L2',
        Picture: 'patient2.jpg',
        Patient_Id: '12345',
        Medivault_Id: generateMedivaultId('Nidhi', 'Shukla', '9876543210'),
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

async function addDummyHospitalCodes() {
  const existingCodes = await HospitalCodes.find({});

  if (existingCodes.length === 0) {
    const hospitals = await HospitalInfo.find({});

    for (const hospital of hospitals) {
      const patients = await PatientInfo.find({ Hospital_Ids: hospital._id });

      for (const patient of patients) {
        await createHospitalCodeForPatient(patient);
      }
    }

    console.log('Dummy data added for Hospital_Codes');
  } else {
    console.log('Dummy data for Hospital_Codes already exists');
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

// Add dummy data for Appointment
async function addDummyAppointments() {
  const existingAppointments = await Appointment.find({});

  if (existingAppointments.length === 0) {
    // Find Hospital_Info and Patient_Info IDs by name
    const hospitalA_Id = await HospitalInfo.findOne({ Name: 'Hospital A' }).select('_id');
    const hospitalC_Id = await HospitalInfo.findOne({ Name: 'Hospital C' }).select('_id');
    const patient1_Id = await PatientInfo.findOne({ Name: 'Hamza Siddiqui' }).select('_id');

    const hospitalB_Id = await HospitalInfo.findOne({ Name: 'Hospital B' }).select('_id');
    const patient2_Id = await PatientInfo.findOne({ Name: 'Nidhi Shukla' }).select('_id');

    const dummyAppointments = [
      {
        Doctor_Name: 'Dr Qi',
        Appointment_Date: '2024-04-10 14:30:00',
        Appointment_Type: 'Regular Checkup',
        Notes: 'To do',
        Status: 'Scheduled',
        Hospital_Id: hospitalA_Id,
        Patient_Id: patient1_Id,
      },
      {
        Doctor_Name: 'Dr Jones',
        Appointment_Date: '2024-04-21 14:30:00',
        Appointment_Type: 'Follow up',
        Notes: 'To do',
        Status: 'Scheduled',
        Hospital_Id: hospitalB_Id,
        Patient_Id: patient2_Id,
      },
      {
        Doctor_Name: 'Dr Priyanka',
        Appointment_Date: '2024-04-01 14:30:00',
        Appointment_Type: 'Follow up',
        Notes: 'To do',
        Status: 'Scheduled',
        Hospital_Id: hospitalC_Id,
        Patient_Id: patient1_Id,
      },
    ];

    await Appointment.insertMany(dummyAppointments);
    console.log('Dummy data added for Appointment');
  } else {
    console.log('Dummy data for Appointment already exists');
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

      // Hash passwords before inserting into the database
      const hashedDummyPatientLogins = await Promise.all(dummyPatientLogins.map(async (login) => {
          return {
              Username: login.Username,
              Password: await hashPassword(login.Password), // Hashing password
              Patient_Id: login.Patient_Id,
          };
      }));

      await PatientLogin.insertMany(hashedDummyPatientLogins);
      console.log('Dummy data added for Patient_Login');
  } else {
      console.log('Dummy data for Patient Login already exists');
  }
}

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

      // Hash passwords before inserting into the database
      const hashedDummyHospitalLogins = await Promise.all(dummyHospitalLogins.map(async (login) => {
          return {
              Username: login.Username,
              Password: await hashPassword(login.Password), // Hashing password
              Hospital_Id: login.Hospital_Id,
          };
      }));

      await HospitalLogin.insertMany(hashedDummyHospitalLogins);
      console.log('Dummy data added for Hospital_Login');
  } else {
      console.log('Dummy data for Hospital_Login already exists');
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
  addDummyAppointments,
  };

