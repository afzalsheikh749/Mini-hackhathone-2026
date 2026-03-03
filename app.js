import { auth, db } from './firebase-config.js';
import { logout, getUserProfile } from './auth.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    orderBy, 
    limit,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


async function initDashboard() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadUserData(user.uid);
            await loadTodayAppointments(user.uid);
            await loadRecentPatients(user.uid);
            await loadStats(user.uid);
            initializeRealtimeListeners(user.uid);
        } else {
            window.location.href = 'index.html';
        }
    });
}

 
async function loadUserData(userId) {
    const result = await getUserProfile(userId);
    if (result.success) {
        const userData = result.data;
        document.querySelector('.user-info p').textContent = userData.name || 'User';
        document.querySelector('.clinic-info h4').textContent = userData.clinicName || 'Clinic Name';
    }
}

 
async function loadTodayAppointments(userId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const appointmentsQuery = query(
            collection(db, "appointments"),
            where("clinicId", "==", userId),
            where("date", ">=", today.toISOString()),
            where("date", "<", tomorrow.toISOString()),
            orderBy("date", "asc"),
            limit(5)
        );
        
        const snapshot = await getDocs(appointmentsQuery);
        const appointmentsList = document.querySelector('.appointments-list');
        
        if (snapshot.empty) {
            appointmentsList.innerHTML = '<p class="no-data">No appointments today</p>';
            return;
        }
        
        appointmentsList.innerHTML = '';
        snapshot.forEach(doc => {
            const appointment = doc.data();
            appointmentsList.appendChild(createAppointmentElement(appointment));
        });
        
    } catch (error) {
        console.error("Error loading appointments:", error);
    }
}

 
function createAppointmentElement(appointment) {
    const div = document.createElement('div');
    div.className = 'appointment-card';
    
    const time = new Date(appointment.date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    div.innerHTML = `
        <div class="time">${time}</div>
        <div class="patient-info">
            <img src="${appointment.patientImage || 'https://via.placeholder.com/40'}" alt="Patient">
            <div>
                <h4>${appointment.patientName}</h4>
                <p>${appointment.patientType || 'Regular'}</p>
            </div>
        </div>
        <div class="doctor">${appointment.doctorName}</div>
        <div class="status ${appointment.status}">
            <span class="dot"></span> ${appointment.status}
        </div>
        <div class="actions">
            <button class="btn-icon" onclick="startConsultation('${appointment.id}')">
                <i class="fas fa-video"></i>
            </button>
            <button class="btn-icon" onclick="checkInPatient('${appointment.id}')">
                <i class="fas fa-check"></i>
            </button>
        </div>
    `;
    
    return div;
}

 
async function loadRecentPatients(userId) {
    try {
        const patientsQuery = query(
            collection(db, "patients"),
            where("clinicId", "==", userId),
            orderBy("lastVisit", "desc"),
            limit(5)
        );
        
        const snapshot = await getDocs(patientsQuery);
        const patientList = document.querySelector('.patient-list');
        
        if (snapshot.empty) {
            patientList.innerHTML = '<p class="no-data">No patients yet</p>';
            return;
        }
        
        patientList.innerHTML = '';
        snapshot.forEach(doc => {
            const patient = doc.data();
            const div = document.createElement('div');
            div.className = 'patient-item';
            
            const lastVisit = patient.lastVisit ? 
                new Date(patient.lastVisit.toDate()).toLocaleDateString() : 'Never';
            
            div.innerHTML = `
                <img src="${patient.image || 'https://via.placeholder.com/45'}" alt="Patient">
                <div>
                    <h4>${patient.name}</h4>
                    <p>Last visit: ${lastVisit}</p>
                </div>
                <span class="badge">${patient.type || 'Regular'}</span>
            `;
            
            patientList.appendChild(div);
        });
        
    } catch (error) {
        console.error("Error loading patients:", error);
    }
}
 
async function loadStats(userId) {
    try {
        // Today's appointments count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const appointmentsQuery = query(
            collection(db, "appointments"),
            where("clinicId", "==", userId),
            where("date", ">=", today.toISOString()),
            where("date", "<", tomorrow.toISOString())
        );
        
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        document.querySelector('.stat-number').textContent = appointmentsSnapshot.size;
        
        // Total patients count
        const patientsQuery = query(
            collection(db, "patients"),
            where("clinicId", "==", userId)
        );
        
        const patientsSnapshot = await getDocs(patientsQuery);
        document.querySelectorAll('.stat-number')[1].textContent = patientsSnapshot.size;
        
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}


function initializeRealtimeListeners(userId) {
    // Listen for new appointments
    const appointmentsQuery = query(
        collection(db, "appointments"),
        where("clinicId", "==", userId),
        orderBy("date", "desc"),
        limit(1)
    );
    
    onSnapshot(appointmentsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                showNotification('New appointment booked!');
                loadTodayAppointments(userId); // Refresh appointments
            }
        });
    });
}

 
function showNotification(message) {
     
    console.log("Notification:", message);
}

function initChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue ($)',
                data: [1200, 1900, 1500, 2100, 1800, 2400, 1600],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

 
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initChart();
    
     
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        const result = await logout();
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            alert('Error logging out: ' + result.error);
        }
    });
     
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.querySelector('span').textContent;
            handleQuickAction(action);
        });
    });
});

 
function handleQuickAction(action) {
    switch(action) {
        case 'New Patient':
            window.location.href = 'patients.html?action=new';
            break;
        case 'Book Appointment':
            window.location.href = 'appointments.html?action=new';
            break;
        case 'New Prescription':
            window.location.href = 'prescriptions.html?action=new';
            break;
        case 'Create Invoice':
            window.location.href = 'billing.html?action=new';
            break;
    }
}