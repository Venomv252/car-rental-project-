const cars = [
    {
        id: 1,
        model: "Toyota Camry",
        type: "economy",
        pricePerDay: 45,
        available: true,
        image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        features: ["AC", "Automatic", "4 Seats"]
    },
    {
        id: 2,
        model: "Honda Civic",
        type: "compact",
        pricePerDay: 40,
        available: true,
        image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        features: ["AC", "Manual", "5 Seats"]
    },
    {
        id: 3,
        model: "Ford Explorer",
        type: "suv",
        pricePerDay: 75,
        available: false,
        image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        features: ["AC", "Automatic", "7 Seats", "4WD"]
    },
    {
        id: 4,
        model: "BMW 3 Series",
        type: "luxury",
        pricePerDay: 120,
        available: true,
        image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        features: ["AC", "Automatic", "4 Seats", "Leather", "GPS"]
    },
    {
        id: 5,
        model: "Chevrolet Tahoe",
        type: "suv",
        pricePerDay: 85,
        available: true,
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        features: ["AC", "Automatic", "8 Seats", "4WD"]
    },
    {
        id: 6,
        model: "Mercedes C-Class",
        type: "luxury",
        pricePerDay: 140,
        available: true,
        image: "https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        features: ["AC", "Automatic", "4 Seats", "Leather", "GPS", "Premium Sound"]
    }
];

let bookings = JSON.parse(localStorage.getItem('carRentalBookings')) || [];
let bookingCounter = parseInt(localStorage.getItem('bookingCounter')) || 1000;

let selectedCar = null;

document.addEventListener('DOMContentLoaded', function() {
    searchCars();
    setupNavigation();
    setupFormHandlers();
    setupDateInputs();
});

function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            document.getElementById(targetId).style.display = 'block';
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    document.getElementById('search').style.display = 'block';
    navLinks[0].classList.add('active');
}

function setupFormHandlers() {
    document.getElementById('booking-form').addEventListener('submit', function(e) {
        e.preventDefault();
        confirmBooking();
    });
    
    document.getElementById('pickup-date').addEventListener('change', validateDates);
    document.getElementById('return-date').addEventListener('change', validateDates);
}

function searchCars() {
    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;
    const carType = document.getElementById('car-type').value;
    
    let filteredCars = cars;
    
    if (carType) {
        filteredCars = filteredCars.filter(car => car.type === carType);
    }
    
    if (pickupDate && returnDate) {
        filteredCars = filteredCars.filter(car => {
            const conflictingBooking = bookings.find(booking => 
                booking.carId === car.id && 
                booking.status === 'active' &&
                ((pickupDate >= booking.pickupDate && pickupDate <= booking.returnDate) ||
                 (returnDate >= booking.pickupDate && returnDate <= booking.returnDate) ||
                 (pickupDate <= booking.pickupDate && returnDate >= booking.returnDate))
            );
            return !conflictingBooking;
        });
    }
    
    displayCars(filteredCars);
}

function displayCars(carsToShow) {
    const carList = document.getElementById('car-list');
    
    if (carsToShow.length === 0) {
        carList.innerHTML = '<div class="loading">No cars available for the selected criteria.</div>';
        return;
    }
    
    carList.innerHTML = '';
    
    carsToShow.forEach(car => {
        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        
        const isAvailable = car.available;
        
        carCard.innerHTML = `
            <div class="car-image-container">
                <img src="${car.image}" alt="${car.model}" class="car-image" onerror="this.src='https://via.placeholder.com/300x200/cccccc/666666?text=Car+Image'">
            </div>
            <div class="car-info">
                <h3>${car.model}</h3>
                <p class="price">$${car.pricePerDay}/day</p>
                <p class="car-type"><strong>Type:</strong> ${car.type.charAt(0).toUpperCase() + car.type.slice(1)}</p>
                <p class="car-features"><strong>Features:</strong> ${car.features.join(', ')}</p>
                <div class="status ${isAvailable ? 'available' : 'unavailable'}">
                    ${isAvailable ? '✅ Available' : '❌ Unavailable'}
                </div>
                <button class="book-btn" ${!isAvailable ? 'disabled' : ''} 
                        onclick="openBookingModal(${car.id})">
                    ${isAvailable ? 'Book Now' : 'Not Available'}
                </button>
            </div>
        `;
        
        carList.appendChild(carCard);
    });
}

function openBookingModal(carId) {
    selectedCar = cars.find(car => car.id === carId);
    if (!selectedCar) return;
    
    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;
    
    if (!pickupDate || !returnDate) {
        alert('Please select pickup and return dates first.');
        return;
    }
    
    const pickup = parseDate(pickupDate);
    const returnD = parseDate(returnDate);
    
    if (!pickup || !returnD) {
        alert('Please enter valid dates in dd/mm/yyyy format.');
        return;
    }
    
    const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
    const totalCost = days * selectedCar.pricePerDay;
    
    document.getElementById('selected-car-info').innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${selectedCar.image}" alt="${selectedCar.model}" style="width: 100%; max-width: 300px; height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 15px;" onerror="this.src='https://via.placeholder.com/300x200/cccccc/666666?text=Car+Image'">
            <h3>${selectedCar.model}</h3>
            <p style="font-size: 1.2em; color: #667eea; font-weight: bold;">$${selectedCar.pricePerDay}/day</p>
        </div>
    `;
    
    document.getElementById('booking-details').innerHTML = `
        <p><strong>Pickup Date:</strong> ${pickupDate}</p>
        <p><strong>Return Date:</strong> ${returnDate}</p>
        <p><strong>Rental Days:</strong> ${days}</p>
        <p><strong>Daily Rate:</strong> $${selectedCar.pricePerDay}</p>
        <hr>
        <p><strong>Total Cost:</strong> $${totalCost}</p>
    `;
    
    document.getElementById('booking-modal').style.display = 'block';
}

function closeBookingModal() {
    document.getElementById('booking-modal').style.display = 'none';
    selectedCar = null;
}

function confirmBooking() {
    if (!selectedCar) return;
    
    const customerName = document.getElementById('customer-name').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const licenseNumber = document.getElementById('license-number').value;
    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;
    
    const pickup = parseDate(pickupDate);
    const returnD = parseDate(returnDate);
    
    if (!pickup || !returnD) {
        alert('Please enter valid dates in dd/mm/yyyy format.');
        return;
    }
    
    const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
    const totalCost = days * selectedCar.pricePerDay;
    
    const booking = {
        id: bookingCounter++,
        carId: selectedCar.id,
        carModel: selectedCar.model,
        customerName,
        customerEmail,
        customerPhone,
        licenseNumber,
        pickupDate,
        returnDate,
        days,
        totalCost,
        status: 'active',
        bookingDate: formatDateToInput(new Date())
    };
    
    bookings.push(booking);
    
    localStorage.setItem('carRentalBookings', JSON.stringify(bookings));
    localStorage.setItem('bookingCounter', bookingCounter.toString());
    
    alert(`Booking confirmed! Your booking ID is: ${booking.id}\nPlease save this ID for future reference.`);
    
    closeBookingModal();
    document.getElementById('booking-form').reset();
    
    searchCars();
}

function loadBookings() {
    const email = document.getElementById('search-email').value.trim();
    const errorDiv = document.getElementById('email-error');
    const bookingList = document.getElementById('booking-list');
    
    // Clear previous error messages and booking list
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    bookingList.innerHTML = '';
    
    if (!email) {
        errorDiv.textContent = 'Please enter your email address.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Email validation - must contain @ and a domain extension
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorDiv.textContent = 'Please enter a valid email address (must contain @ and domain like .com, .org, etc.)';
        errorDiv.style.display = 'block';
        return;
    }
    
    const userBookings = bookings.filter(booking => 
        booking.customerEmail.toLowerCase() === email.toLowerCase()
    );
    
    if (userBookings.length === 0) {
        bookingList.innerHTML = '<p>No bookings found for this email address.</p>';
        return;
    }
    
    bookingList.innerHTML = '';
    
    userBookings.forEach(booking => {
        const bookingItem = document.createElement('div');
        bookingItem.className = 'booking-item';
        
        bookingItem.innerHTML = `
            <h3>Booking #${booking.id}</h3>
            <p><strong>Car:</strong> ${booking.carModel}</p>
            <p><strong>Customer:</strong> ${booking.customerName}</p>
            <p><strong>Pickup Date:</strong> ${booking.pickupDate}</p>
            <p><strong>Return Date:</strong> ${booking.returnDate}</p>
            <p><strong>Duration:</strong> ${booking.days} days</p>
            <p><strong>Total Cost:</strong> $${booking.totalCost}</p>
            <p><strong>Booking Date:</strong> ${booking.bookingDate}</p>
            <div class="booking-status ${booking.status}">${booking.status.toUpperCase()}</div>
            ${booking.status === 'active' ? 
                `<button onclick="cancelBooking(${booking.id})" style="background: #dc3545; margin-top: 10px;">Cancel Booking</button>` : 
                ''
            }
        `;
        
        bookingList.appendChild(bookingItem);
    });
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            localStorage.setItem('carRentalBookings', JSON.stringify(bookings));
            loadBookings();
            searchCars();
            alert('Booking cancelled successfully.');
        }
    }
}

function processReturn() {
    const bookingId = document.getElementById('booking-id').value.trim();
    const condition = document.getElementById('return-condition').value;
    const notes = document.getElementById('return-notes').value.trim();
    
    if (!bookingId) {
        alert('Please enter your booking ID.');
        return;
    }
    
    const booking = bookings.find(b => b.id == bookingId);
    
    if (!booking) {
        document.getElementById('return-result').innerHTML = 
            '<div style="color: red; padding: 20px; background: #f8d7da; border-radius: 8px; margin-top: 20px;">Booking ID not found.</div>';
        return;
    }
    
    if (booking.status !== 'active') {
        document.getElementById('return-result').innerHTML = 
            '<div style="color: red; padding: 20px; background: #f8d7da; border-radius: 8px; margin-top: 20px;">This booking is not active or has already been returned.</div>';
        return;
    }
    
    booking.status = 'completed';
    booking.returnCondition = condition;
    booking.returnNotes = notes;
    booking.actualReturnDate = formatDateToInput(new Date());
    
    let additionalCharges = 0;
    if (condition === 'poor') {
        additionalCharges = 200;
    } else if (condition === 'fair') {
        additionalCharges = 100;
    }
    
    booking.additionalCharges = additionalCharges;
    
    localStorage.setItem('carRentalBookings', JSON.stringify(bookings));
    
    document.getElementById('return-result').innerHTML = `
        <div style="color: green; padding: 20px; background: #d4edda; border-radius: 8px; margin-top: 20px;">
            <h3>Return Processed Successfully!</h3>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>Car:</strong> ${booking.carModel}</p>
            <p><strong>Return Date:</strong> ${booking.actualReturnDate}</p>
            <p><strong>Vehicle Condition:</strong> ${condition.charAt(0).toUpperCase() + condition.slice(1)}</p>
            ${additionalCharges > 0 ? `<p><strong>Additional Charges:</strong> $${additionalCharges}</p>` : ''}
            <p><strong>Total Amount:</strong> $${booking.totalCost + additionalCharges}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
    `;
    
    document.getElementById('booking-id').value = '';
    document.getElementById('return-condition').value = 'excellent';
    document.getElementById('return-notes').value = '';
    
    searchCars();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateLong(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function validateDates() {
    const pickupDate = document.getElementById('pickup-date').value;
    const returnDate = document.getElementById('return-date').value;
    
    if (pickupDate && returnDate) {
        const pickup = parseDate(pickupDate);
        const returnD = parseDate(returnDate);
        
        if (pickup && returnD && returnD <= pickup) {
            alert('Return date must be after pickup date.');
            document.getElementById('return-date').value = '';
        }
    }
}

function setupDateInputs() {
    const pickupInput = document.getElementById('pickup-date');
    const returnInput = document.getElementById('return-date');
    
    pickupInput.addEventListener('input', function(e) {
        formatDateInput(e.target);
    });
    
    returnInput.addEventListener('input', function(e) {
        formatDateInput(e.target);
    });
    
    pickupInput.addEventListener('blur', function(e) {
        validateDateInput(e.target);
    });
    
    returnInput.addEventListener('blur', function(e) {
        validateDateInput(e.target);
    });
}

function formatDateInput(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
        value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    
    input.value = value;
}

function validateDateInput(input) {
    const value = input.value;
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = value.match(dateRegex);
    
    if (!match) {
        if (value.length > 0) {
            input.setCustomValidity('Please enter date in dd/mm/yyyy format');
        } else {
            input.setCustomValidity('');
        }
        return false;
    }
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    if (month < 1 || month > 12) {
        input.setCustomValidity('Invalid month (01-12)');
        return false;
    }
    
    if (day < 1 || day > 31) {
        input.setCustomValidity('Invalid day (01-31)');
        return false;
    }
    
    if (year < new Date().getFullYear()) {
        input.setCustomValidity('Date cannot be in the past');
        return false;
    }
    
    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        input.setCustomValidity('Invalid date');
        return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
        input.setCustomValidity('Date cannot be in the past');
        return false;
    }
    
    input.setCustomValidity('');
    return true;
}

function parseDate(dateString) {
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    
    return new Date(year, month, day);
}

function formatDateToInput(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

let currentCalendarDate = new Date();
let selectedInputId = null;

function openCalendar(inputId) {
    selectedInputId = inputId;
    const modal = document.getElementById('calendar-modal');
    const title = document.getElementById('calendar-title');
    
    if (inputId === 'pickup-date') {
        title.textContent = 'Select Pickup Date';
    } else if (inputId === 'return-date') {
        title.textContent = 'Select Return Date';
    } else {
        title.textContent = 'Select Date';
    }
    
    const inputValue = document.getElementById(inputId).value;
    if (inputValue) {
        const parsedDate = parseDate(inputValue);
        if (parsedDate) {
            currentCalendarDate = new Date(parsedDate);
        }
    } else {
        currentCalendarDate = new Date();
    }
    
    renderCalendar();
    modal.style.display = 'block';
}

function closeCalendar() {
    document.getElementById('calendar-modal').style.display = 'none';
    selectedInputId = null;
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function selectToday() {
    const today = new Date();
    selectDate(today);
}

function selectDate(date) {
    if (selectedInputId) {
        const formattedDate = formatDateToInput(date);
        document.getElementById(selectedInputId).value = formattedDate;
        
        validateDateInput(document.getElementById(selectedInputId));
        
        if (selectedInputId === 'pickup-date') {
            validateDates();
        }
        else if (selectedInputId === 'return-date') {
            validateDates();
        }
    }
    closeCalendar();
}

function renderCalendar() {
    const monthYear = document.getElementById('calendar-month-year');
    const calendarDays = document.getElementById('calendar-days');
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthYear.textContent = `${monthNames[month]} ${year}`;
    
    calendarDays.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();
    
    let selectedDate = null;
    if (selectedInputId) {
        const inputValue = document.getElementById(selectedInputId).value;
        if (inputValue) {
            const parsedDate = parseDate(inputValue);
            if (parsedDate && parsedDate.getFullYear() === year && parsedDate.getMonth() === month) {
                selectedDate = parsedDate.getDate();
            }
        }
    }
    
    for (let i = 0; i < startingDayOfWeek; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        dayElement.textContent = prevMonthLastDay - startingDayOfWeek + i + 1;
        calendarDays.appendChild(dayElement);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(year, month, day);
        const isPastDate = currentDate < today.setHours(0, 0, 0, 0);
        
        if (isPastDate) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.addEventListener('click', () => selectDate(new Date(year, month, day)));
        }
        
        if (isCurrentMonth && day === todayDate) {
            dayElement.classList.add('today');
        }
        
        if (day === selectedDate) {
            dayElement.classList.add('selected');
        }
        
        calendarDays.appendChild(dayElement);
    }
    
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells && i <= 14; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = i;
        calendarDays.appendChild(dayElement);
    }
}

window.onclick = function(event) {
    const bookingModal = document.getElementById('booking-modal');
    const calendarModal = document.getElementById('calendar-modal');
    
    if (event.target === bookingModal) {
        closeBookingModal();
    }
    
    if (event.target === calendarModal) {
        closeCalendar();
    }
}