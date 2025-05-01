# MediVault - Secure Medical Record Storage

![Project Logo](https://github.com/HamzaSid020/MediVault/blob/main/static/logo.png?raw=true)

MediVault is a secure, blockchain-based platform for storing and managing medical records with patient-controlled access.

## Features

- 🔒 Blockchain-secured medical data storage  
- 👤 Patient-centric access control  
- 🏥 HIPAA/GDPR compliant design  
- 📱 Responsive web interface  
- 🔑 Cryptographic security for all records  
- 📊 Analytics dashboard for healthcare providers  

## Technologies Used

- **Frontend**: React.js, Tailwind CSS  
- **Backend**: Node.js, Express  
- **Blockchain**: Ethereum, Smart Contracts (Solidity)  
- **Database**: MongoDB (for non-sensitive metadata)  
- **Security**: AES-256 encryption, JWT authentication  

## Installation

1. Clone the repository:
    ```
    git clone https://github.com/HamzaSid020/MediVault.git
    cd MediVault
    ```

2. Install dependencies for both frontend and backend:
    ```
    cd client && npm install
    cd ../server && npm install
    ```

3. Set up environment variables:  
   Create `.env` files in both `client` and `server` directories with required configurations.

4. Run the development servers:
    ```
    # In one terminal (for backend)
    cd server && npm run dev

    # In another terminal (for frontend)
    cd client && npm start
    ```

## Project Structure
| Folder      | Description                     |
|-------------|---------------------------------|
| client/     | Frontend React application      |
| server/     | Backend Node.js server          |
| contracts/  | Smart contract code             |
| static/     | Static assets (images, etc.)    |
| docs/       | Documentation                   |
| tests/      | Unit and integration tests      |

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the project  
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)  
3. Commit your changes (`git commit -m 'Add some amazing feature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request  

## License

This project is licensed under the MIT License - see the LICENSE file for details.

