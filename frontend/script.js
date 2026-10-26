
const BOOKS_KEY = "shelfsync_books";
const MEMBERS_KEY = "shelfsync_members";
const ISSUED_KEY = "shelfsync_issuedBooks";

// Initial book data
const defaultBooks = [
    { id: 101, name: "Java Programming", author: "James Gosling", quantity: 5 },
    { id: 102, name: "Python Basics", author: "Guido van Rossum", quantity: 8 },
    { id: 103, name: "Database Management", author: "Raghu Ramakrishnan", quantity: 4 }
];

// Initial member data
const defaultMembers = [
    { id: 201, name: "Aditya", email: "aditya@gmail.com", phone: "9876543210" },
    { id: 202, name: "Rahul", email: "rahul@gmail.com", phone: "9876543211" },
    { id: 203, name: "Priya", email: "priya@gmail.com", phone: "9876543212" }
];

// Load saved data, or use default data on first visit
function loadData(key, defaultData) {
    try {
        const savedData = localStorage.getItem(key);

        if (savedData === null) {
            localStorage.setItem(key, JSON.stringify(defaultData));
            return defaultData.map(item => ({ ...item }));
        }

        const parsedData = JSON.parse(savedData);

        return Array.isArray(parsedData) ? parsedData : defaultData.map(item => ({ ...item }));
    } catch (error) {
        console.error("Could not load saved data:", error);
        return defaultData.map(item => ({ ...item }));
    }
}

let books = loadData(BOOKS_KEY, defaultBooks);
let members = loadData(MEMBERS_KEY, defaultMembers);
let issuedBooks = loadData(ISSUED_KEY, []);

// Save data in the browser
function saveData() {
    try {
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
        localStorage.setItem(ISSUED_KEY, JSON.stringify(issuedBooks));
        return true;
    } catch (error) {
        console.error("Could not save data:", error);
        alert("Could not save data. Check your browser storage.");
        return false;
    }
}

// Calculate total available copies
function getTotalBooks() {
    return books.reduce((total, book) => total + Number(book.quantity), 0);
}

// Dashboard

function showDashboard() {
    const totalTitles = books.length;
    const totalMembersCount = members.length;
    const issuedCount = issuedBooks.length;
    const availableCopies = getTotalBooks();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueCount = issuedBooks.filter(record => {
        if (!record.dueDate) return false;

        const dueDate = new Date(record.dueDate);

        return !isNaN(dueDate.getTime()) && dueDate < today;
    }).length;

    document.querySelector("main").innerHTML = `
        <h2>Library Dashboard</h2>

        <div class="cards">
            <div class="card">
                <h3>Book Titles</h3>
                <p>${totalTitles}</p>
            </div>

            <div class="card">
                <h3>Total Members</h3>
                <p>${totalMembersCount}</p>
            </div>

            <div class="card">
                <h3>Books Issued</h3>
                <p>${issuedCount}</p>
            </div>

            <div class="card">
                <h3>Available Copies</h3>
                <p>${availableCopies}</p>
            </div>

            <div class="card">
                <h3>Overdue Books</h3>
                <p>${overdueCount}</p>
            </div>
        </div>

        <br>

        <button class="action-btn" onclick="showIssuedBooks()">
            View Issued Books
        </button>
    `;
}


// Display books
function showBooks() {
    document.querySelector("main").innerHTML = `
        <h2>Books</h2>

        <button class="action-btn" onclick="addBook()">Add Book</button>

        <br><br>

        <input
            type="text"
            id="searchBook"
            placeholder="Search book..."
            oninput="searchBooks()"
        >

        <table id="bookTable">
            <thead>
                <tr>
                    <th>Book ID</th>
                    <th>Book Name</th>
                    <th>Author</th>
                    <th>Available Quantity</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    const tableBody = document.querySelector("#bookTable tbody");

    books.forEach(book => {
        const row = tableBody.insertRow();

        [book.id, book.name, book.author, book.quantity].forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });

        const actionCell = row.insertCell();

        const editButton = document.createElement("button");
        editButton.className = "action-btn";
        editButton.textContent = "Edit";
        editButton.onclick = () => editBook(book.id);

        const deleteButton = document.createElement("button");
        deleteButton.className = "action-btn";
        deleteButton.textContent = "Delete";
        deleteButton.style.marginLeft = "5px";
        deleteButton.onclick = () => deleteBook(book.id);

        actionCell.append(editButton, deleteButton);
    });
}

// Search books by title or author
function searchBooks() {
    const input = document.getElementById("searchBook");
    if (!input) return;

    const filter = input.value.toLowerCase();

    document.querySelectorAll("#bookTable tbody tr").forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const author = row.cells[2].textContent.toLowerCase();

        row.style.display =
            name.includes(filter) || author.includes(filter) ? "" : "none";
    });
}

// Add book form
function addBook() {
    document.querySelector("main").innerHTML = `
        <h2>Add Book</h2>

        <div class="form-box">
            <label for="newBookId">Book ID</label>
            <input type="number" id="newBookId" min="1" placeholder="Enter Book ID">

            <label for="newBookName">Book Name</label>
            <input type="text" id="newBookName" placeholder="Enter Book Name">

            <label for="newAuthor">Author</label>
            <input type="text" id="newAuthor" placeholder="Enter Author">

            <label for="newQuantity">Quantity</label>
            <input type="number" id="newQuantity" min="0" placeholder="Enter Quantity">

            <button onclick="saveNewBook()">Add Book</button>
            <button onclick="showBooks()">Cancel</button>
        </div>
    `;
}

// Save a new book
function saveNewBook() {
    const id = Number(document.getElementById("newBookId").value);
    const name = document.getElementById("newBookName").value.trim();
    const author = document.getElementById("newAuthor").value.trim();
    const quantityText = document.getElementById("newQuantity").value;
    const quantity = Number(quantityText);

    if (
        !Number.isInteger(id) || id <= 0 ||
        !name || !author ||
        quantityText === "" || !Number.isInteger(quantity) || quantity < 0
    ) {
        alert("Enter a valid ID, name, author, and non-negative whole-number quantity.");
        return;
    }

    if (books.some(book => Number(book.id) === id)) {
        alert("Book ID already exists.");
        return;
    }

    books.push({ id, name, author, quantity });

    if (!saveData()) {
        books.pop();
        return;
    }

    alert("Book added successfully!");
    showBooks();
}

// Edit book form
function editBook(bookId) {
    const book = books.find(item => Number(item.id) === Number(bookId));

    if (!book) {
        alert("Book not found.");
        return;
    }

    document.querySelector("main").innerHTML = `
        <h2>Edit Book</h2>

        <div class="form-box">
            <label for="editBookId">Book ID</label>
            <input type="number" id="editBookId" value="${book.id}" readonly>

            <label for="editBookName">Book Name</label>
            <input type="text" id="editBookName">

            <label for="editAuthor">Author</label>
            <input type="text" id="editAuthor">

            <label for="editQuantity">Available Quantity</label>
            <input type="number" id="editQuantity" min="0">

            <button onclick="saveEditedBook(${book.id})">Save Changes</button>
            <button onclick="showBooks()">Cancel</button>
        </div>
    `;

    document.getElementById("editBookName").value = book.name;
    document.getElementById("editAuthor").value = book.author;
    document.getElementById("editQuantity").value = book.quantity;
}

// Save edited book
function saveEditedBook(bookId) {
    const book = books.find(item => Number(item.id) === Number(bookId));

    if (!book) {
        alert("Book not found.");
        return;
    }

    const name = document.getElementById("editBookName").value.trim();
    const author = document.getElementById("editAuthor").value.trim();
    const quantityText = document.getElementById("editQuantity").value;
    const quantity = Number(quantityText);

    if (
        !name || !author ||
        quantityText === "" || !Number.isInteger(quantity) || quantity < 0
    ) {
        alert("Enter a valid name, author, and non-negative whole-number quantity.");
        return;
    }

    // Do not reduce available stock below the number already issued.
    const issuedCount = issuedBooks.filter(
        item => Number(item.bookId) === Number(bookId)
    ).length;

    if (quantity < 0) {
        alert("Quantity cannot be negative.");
        return;
    }

    const oldBook = { ...book };

    book.name = name;
    book.author = author;
    book.quantity = quantity;

    if (!saveData()) {
        Object.assign(book, oldBook);
        return;
    }

    alert("Book updated successfully!");
    showBooks();
}

// Delete book
function deleteBook(bookId) {
    const hasIssuedCopies = issuedBooks.some(
        item => Number(item.bookId) === Number(bookId)
    );

    if (hasIssuedCopies) {
        alert("This book has issued copies. Return them before deleting the book.");
        return;
    }

    if (!confirm("Are you sure you want to delete this book?")) {
        return;
    }

    const oldBooks = [...books];
    books = books.filter(book => Number(book.id) !== Number(bookId));

    if (!saveData()) {
        books = oldBooks;
        return;
    }

    alert("Book deleted successfully!");
    showBooks();
}

// Display members


/* =================================
   MEMBER MANAGEMENT
================================= */

// Display all members
function showMembers() {
    document.querySelector("main").innerHTML = `
        <h2>Library Members</h2>

        <button class="action-btn" onclick="addMember()">
            + Add Member
        </button>

        <table>
            <thead>
                <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="membersTable"></tbody>
        </table>
    `;

    const tableBody = document.getElementById("membersTable");

    if (members.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">No members registered yet.</td>
            </tr>
        `;
        return;
    }

    members.forEach(member => {
        const row = tableBody.insertRow();

        [member.id, member.name, member.email, member.phone]
            .forEach(value => {
                row.insertCell().textContent = value;
            });

        const actionCell = row.insertCell();

        const editButton = document.createElement("button");
        editButton.className = "action-btn";
        editButton.textContent = "Edit";
        editButton.onclick = () => editMember(member.id);

        const deleteButton = document.createElement("button");
        deleteButton.className = "action-btn";
        deleteButton.textContent = "Delete";
        deleteButton.style.backgroundColor = "#dc2626";
        deleteButton.style.marginLeft = "5px";
        deleteButton.onclick = () => deleteMember(member.id);

        actionCell.append(editButton, deleteButton);
    });
}


// Display the Edit Member form
function editMember(memberId) {
    const member = members.find(
        item => Number(item.id) === Number(memberId)
    );

    if (!member) {
        alert("Member not found.");
        return;
    }

    document.querySelector("main").innerHTML = `
        <h2>Edit Member</h2>

        <div class="form-box">
            <label for="editMemberId">Member ID</label>
            <input id="editMemberId" type="number"
                   value="${member.id}" readonly>

            <label for="editMemberName">Full Name</label>
            <input id="editMemberName" type="text">

            <label for="editMemberEmail">Email Address</label>
            <input id="editMemberEmail" type="email">

            <label for="editMemberPhone">Phone Number</label>
            <input id="editMemberPhone" type="tel">

            <button onclick="saveEditedMember(${member.id})">
                Save Changes
            </button>

            <button class="action-btn" onclick="showMembers()">
                Cancel
            </button>
        </div>
    `;

    document.getElementById("editMemberName").value = member.name;
    document.getElementById("editMemberEmail").value = member.email;
    document.getElementById("editMemberPhone").value = member.phone;
}


// Save edited member details
function saveEditedMember(memberId) {
    const member = members.find(
        item => Number(item.id) === Number(memberId)
    );

    if (!member) {
        alert("Member not found.");
        return;
    }

    const name = document.getElementById("editMemberName").value.trim();
    const email = document.getElementById("editMemberEmail").value.trim();
    const phone = document.getElementById("editMemberPhone").value.trim();

    if (!name || !email || !phone) {
        alert("Please fill in all fields.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    const duplicateEmail = members.some(item =>
        Number(item.id) !== Number(memberId) &&
        item.email.toLowerCase() === email.toLowerCase()
    );

    if (duplicateEmail) {
        alert("This email is already registered to another member.");
        return;
    }

    const oldMember = { ...member };

    member.name = name;
    member.email = email;
    member.phone = phone;

    if (!saveData()) {
        Object.assign(member, oldMember);
        return;
    }

    alert("Member updated successfully!");
    showMembers();
}


// Delete a member
function deleteMember(memberId) {
    const member = members.find(
        item => Number(item.id) === Number(memberId)
    );

    if (!member) {
        alert("Member not found.");
        return;
    }

    // Prevent deleting members who still have issued books
    const hasIssuedBooks = issuedBooks.some(
        record => Number(record.memberId) === Number(memberId)
    );

    if (hasIssuedBooks) {
        alert("This member has issued books. Return them before deleting this member.");
        return;
    }

    if (!confirm(`Are you sure you want to delete ${member.name}?`)) {
        return;
    }

    const oldMembers = [...members];

    members = members.filter(
        item => Number(item.id) !== Number(memberId)
    );

    if (!saveData()) {
        members = oldMembers;
        return;
    }

    alert("Member deleted successfully!");
    showMembers();
}


// Issue book form
function issueBook() {
    document.querySelector("main").innerHTML = `
        <h2>Issue Book</h2>

        <div class="form-box">
            <label for="memberId">Member ID</label>
            <input type="number" id="memberId" placeholder="Enter Member ID">

            <label for="bookId">Book ID</label>
            <input type="number" id="bookId" placeholder="Enter Book ID">

            <button onclick="submitIssue()">Issue Book</button>
        </div>
    `;
}

// Issue a book to a valid member

function submitIssue() {
    const memberId = Number(document.getElementById("memberId").value);
    const bookId = Number(document.getElementById("bookId").value);

    if (!memberId || !bookId) {
        alert("Please enter valid Member ID and Book ID.");
        return;
    }

    const member = members.find(item => Number(item.id) === memberId);
    const book = books.find(item => Number(item.id) === bookId);

    if (!member) {
        alert("Member ID not found.");
        return;
    }

    if (!book) {
        alert("Book ID not found.");
        return;
    }

    if (book.quantity <= 0) {
        alert("No copies are currently available.");
        return;
    }

    // Set issue date and a due date 14 days later
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);

    book.quantity--;

    issuedBooks.push({
        memberId,
        bookId,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString()
    });

    if (!saveData()) {
        book.quantity++;
        issuedBooks.pop();
        return;
    }

    alert("Book issued successfully! Return it within 14 days.");
    showDashboard();
}


// Return book form
function returnBook() {
    document.querySelector("main").innerHTML = `
        <h2>Return Book</h2>

        <div class="form-box">
            <label for="returnMemberId">Member ID</label>
            <input type="number" id="returnMemberId" placeholder="Enter Member ID">

            <label for="returnBookId">Book ID</label>
            <input type="number" id="returnBookId" placeholder="Enter Book ID">

            <button onclick="submitReturn()">Return Book</button>
        </div>
    `;
}

// Return only a book that was actually issued to that member
function submitReturn() {
    const memberId = Number(document.getElementById("returnMemberId").value);
    const bookId = Number(document.getElementById("returnBookId").value);

    if (!memberId || !bookId) {
        alert("Please enter valid Member ID and Book ID.");
        return;
    }

    const member = members.find(item => Number(item.id) === memberId);
    const book = books.find(item => Number(item.id) === bookId);

    if (!member) {
        alert("Member ID not found.");
        return;
    }

    if (!book) {
        alert("Book ID not found.");
        return;
    }

    const issueIndex = issuedBooks.findIndex(
        item => Number(item.memberId) === memberId &&
                Number(item.bookId) === bookId
    );

    if (issueIndex === -1) {
        alert("No matching issued record found for this member and book.");
        return;
    }

    const returnedRecord = issuedBooks.splice(issueIndex, 1)[0];
    book.quantity++;

    if (!saveData()) {
        issuedBooks.splice(issueIndex, 0, returnedRecord);
        book.quantity--;
        return;
    }

    alert("Book returned successfully!");
    showDashboard();
}


function showIssuedBooks() {
    document.querySelector("main").innerHTML = `
        <h2>Issued Books</h2>

        <table>
            <thead>
                <tr>
                    <th>Book ID</th>
                    <th>Book Name</th>
                    <th>Member ID</th>
                    <th>Member Name</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody id="issuedBooksTable"></tbody>
        </table>
    `;

    const table = document.getElementById("issuedBooksTable");

    if (issuedBooks.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No books are currently issued.</td>
            </tr>
        `;
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    issuedBooks.forEach(record => {
        const book = books.find(
            item => Number(item.id) === Number(record.bookId)
        );

        const member = members.find(
            item => Number(item.id) === Number(record.memberId)
        );

        let status = "On time";
        let statusClass = "status-on-time";
        let dueDate = null;

        if (record.dueDate) {
            dueDate = new Date(record.dueDate);

            if (isNaN(dueDate.getTime())) {
                dueDate = null;
                status = "Date unavailable";
                statusClass = "";
            } else {
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate < today) {
                    status = "Overdue";
                    statusClass = "status-overdue";
                }
            }
        } else {
            status = "Date unavailable";
            statusClass = "";
        }

        const row = table.insertRow();

        const values = [
            record.bookId,
            book ? book.name : "Unknown Book",
            record.memberId,
            member ? member.name : "Unknown Member",
            record.issueDate
                ? new Date(record.issueDate).toLocaleDateString()
                : "N/A",
            dueDate ? dueDate.toLocaleDateString() : "N/A"
        ];

        values.forEach(value => {
            row.insertCell().textContent = value;
        });

        const statusCell = row.insertCell();
        statusCell.textContent = status;
        statusCell.className = statusClass;
    });
}

/* =========================
   ADD MEMBER FEATURE
========================= */

// Display the Add Member form
function addMember() {
    document.querySelector("main").innerHTML = `
        <h2>Add New Member</h2>

        <div class="form-box">
            <label for="newMemberId">Member ID</label>
            <input
                type="number"
                id="newMemberId"
                min="1"
                placeholder="Enter Member ID"
            >

            <label for="newMemberName">Full Name</label>
            <input
                type="text"
                id="newMemberName"
                placeholder="Enter Full Name"
            >

            <label for="newMemberEmail">Email Address</label>
            <input
                type="email"
                id="newMemberEmail"
                placeholder="Enter Email Address"
            >

            <label for="newMemberPhone">Phone Number</label>
            <input
                type="tel"
                id="newMemberPhone"
                placeholder="Enter Phone Number"
            >

            <button onclick="saveNewMember()">Register Member</button>
            <button class="action-btn" onclick="showMembers()">Cancel</button>
        </div>
    `;
}

// Validate and save a new member
function saveNewMember() {
    const idText = document.getElementById("newMemberId").value.trim();
    const name = document.getElementById("newMemberName").value.trim();
    const email = document.getElementById("newMemberEmail").value.trim();
    const phone = document.getElementById("newMemberPhone").value.trim();

    const id = Number(idText);

    if (
        idText === "" ||
        !Number.isInteger(id) ||
        id <= 0 ||
        name === "" ||
        email === "" ||
        phone === ""
    ) {
        alert("Please fill in all fields with valid details.");
        return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    // Check for duplicate Member ID
    if (members.some(member => Number(member.id) === id)) {
        alert("This Member ID already exists.");
        return;
    }

    // Check for duplicate email
    if (members.some(
        member => member.email.toLowerCase() === email.toLowerCase()
    )) {
        alert("This email address is already registered.");
        return;
    }

    const newMember = {
        id: id,
        name: name,
        email: email,
        phone: phone
    };

    members.push(newMember);

    // Save using the existing localStorage function
    if (!saveData()) {
        members.pop();
        return;
    }

    alert("Member registered successfully!");

    // Show the updated member list
    showMembers();
}
