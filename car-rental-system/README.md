# 🚗 Car Rental Booking System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-blue.svg)](https://www.mysql.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A comprehensive car rental booking system built with HTML, CSS, JavaScript frontend and Node.js backend. This system automates the traditional car rental process, preventing double bookings and providing efficient search, booking, and return tracking capabilities.

## 🌟 Live Demo

![Car Rental System Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=Car+Rental+System+Demo)

> **Note**: Replace the placeholder image above with actual screenshots of your application

## ✨ Features

### Core Functionality
- **Car Search & Filtering**: Search available cars by date, type, and price range
- **Real-time Booking**: Instant booking with conflict detection to prevent double bookings
- **Booking Management**: View, modify, and cancel existing bookings
- **Vehicle Return Processing**: Complete return workflow with condition assessment
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Advanced Features
- **Date Validation**: Prevents invalid date selections and booking conflicts
- **Dynamic Pricing**: Automatic cost calculation based on rental duration
- **Condition-based Charges**: Additional fees based on vehicle return condition
- **Booking History**: Complete booking history with status tracking
- **Email-based Lookup**: Find bookings using email address

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with flexbox/grid, animations, and responsive design
- **Vanilla JavaScript**: Dynamic functionality and API integration
- **dd/mm/yyyy Date Format**: European date format throughout the application

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **MySQL**: Relational database for data persistence
- **RESTful API**: Clean API design for frontend-backend communication
- **Connection Pooling**: Efficient database connection management

## 📁 Project Structure

```
car-rental-system/
├── frontend/
│   ├── index.html          # Main application interface
│   ├── styles.css          # Comprehensive styling
│   └── script.js           # Frontend logic and API calls
├── backend/
│   ├── app.js              # Express server setup
│   ├── database.js         # In-memory database simulation
│   ├── package.json        # Dependencies and scripts
│   ├── models/             # Data models (future expansion)
│   └── routes/
│       ├── cars.js         # Car-related API endpoints
│       ├── bookings.js     # Booking management endpoints
│       └── returns.js      # Return processing endpoints
└── README.md               # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **MySQL** (v5.7 or higher)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd car-rental-system
   ```

2. **Set up MySQL Database**
   
   **Option A: Using MySQL Command Line**
   ```bash
   mysql -u root -p < backend/setup-database.sql
   ```
   
   **Option B: Using MySQL Workbench or phpMyAdmin**
   - Open the `backend/setup-database.sql` file
   - Execute the SQL script in your MySQL client

3. **Configure Database Connection**
   ```bash
   cd backend
   cp .env.example .env  # If .env doesn't exist, create it
   ```
   
   Edit the `.env` file with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=car_rental_system
   DB_PORT=3306
   PORT=3000
   NODE_ENV=development
   ```

4. **Install backend dependencies**
   ```bash
   npm install
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser and go to: `http://localhost:3000`
   - The frontend will be served automatically

### Development Mode
For development with auto-restart:
```bash
npm run dev  # Requires nodemon
```

### Database Schema

The system creates the following tables:
- **cars**: Vehicle inventory with specifications
- **customers**: Customer information and contact details
- **bookings**: Rental bookings with dates and status
- **returns**: Vehicle return records with condition assessment

## 📖 API Documentation

### Cars Endpoints
- `GET /api/cars` - Get all cars with optional filters
- `GET /api/cars/:id` - Get specific car details
- `PUT /api/cars/:id/availability` - Update car availability

### Bookings Endpoints
- `GET /api/bookings` - Get all bookings (with email filter)
- `GET /api/bookings/:id` - Get specific booking
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id/status` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Returns Endpoints
- `GET /api/returns` - Get all return records
- `GET /api/returns/:id` - Get specific return record
- `POST /api/returns` - Process vehicle return
- `POST /api/returns/validate` - Validate booking for return

## 🎯 Usage Guide

### For Customers

1. **Search for Cars**
   - Select pickup and return dates
   - Choose car type (optional)
   - Click "Search Available Cars"

2. **Make a Booking**
   - Click "Book Now" on desired car
   - Fill in personal details
   - Review booking summary
   - Confirm booking and save the booking ID

3. **Manage Bookings**
   - Go to "My Bookings" section
   - Enter your email to view bookings
   - Cancel active bookings if needed

4. **Return Vehicle**
   - Go to "Returns" section
   - Enter your booking ID
   - Select vehicle condition
   - Add any notes about damages
   - Process the return

### For Administrators

The system provides API endpoints for administrative tasks:
- Monitor booking statistics
- Update car availability
- Process returns with damage assessment
- Generate reports on fleet utilization

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=3000
NODE_ENV=development
```

### Database Configuration
Currently uses in-memory storage. To integrate with a real database:

1. Install database driver (e.g., `mysql2`, `pg`, `mongodb`)
2. Update `database.js` with actual database connections
3. Implement proper data persistence

## 🚀 Deployment

### Local Deployment
The system is ready to run locally with the installation steps above.

### Production Deployment
For production deployment:

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure proper database
   - Set up environment variables

2. **Database Migration**
   - Replace in-memory storage with persistent database
   - Run database migrations
   - Set up proper indexing

3. **Security Enhancements**
   - Add authentication and authorization
   - Implement rate limiting
   - Add input validation and sanitization
   - Set up HTTPS

## 🔒 Security Considerations

Current implementation is for demonstration purposes. For production use:

- Add user authentication and authorization
- Implement input validation and sanitization
- Add rate limiting to prevent abuse
- Use HTTPS for secure communication
- Implement proper error handling
- Add logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the API documentation above
- Review the code comments for implementation details
- Test the system with the provided sample data

## 🔮 Future Enhancements

- User authentication system
- Payment integration
- Email notifications
- Advanced reporting dashboard
- Mobile app development
- GPS tracking integration
- Loyalty program features
- Multi-language support
