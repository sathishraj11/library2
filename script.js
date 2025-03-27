// Enumerations
const BookFormat = {
    HARDCOVER: 'Hardcover',
    PAPERBACK: 'Paperback',
    AUDIOBOOK: 'Audiobook',
    EBOOK: 'Ebook',
    NEWSPAPER: 'Newspaper',
    MAGAZINE: 'Magazine',
    JOURNAL: 'Journal'
  };
  
  const BookStatus = {
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    LOANED: 'Loaned',
    LOST: 'Lost'
  };
  
  const ReservationStatus = {
    WAITING: 'Waiting',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    CANCELED: 'Canceled',
    NONE: 'None'
  };
  
  const AccountStatus = {
    ACTIVE: 'Active',
    CLOSED: 'Closed',
    CANCELED: 'Canceled',
    BLACKLISTED: 'Blacklisted',
    NONE: 'None'
  };
  
  // Data Types
  class Address {
    constructor(streetAddress, city, state, zipcode, country) {
      this.streetAddress = streetAddress;
      this.city = city;
      this.state = state;
      this.zipcode = zipcode;
      this.country = country;
    }
  }
  
  class Person {
    constructor(name, address, email, phone) {
      this.name = name;
      this.address = address;
      this.email = email;
      this.phone = phone;
    }
  }
  
  // Core Classes
  class Author {
    constructor(name, description) {
      this.name = name;
      this.description = description;
      this.books = [];
    }
  
    getName() {
      return this.name;
    }
  }
  
  class Book {
    constructor(isbn, title, subject, publisher, language, numberOfPages) {
      this.isbn = isbn;
      this.title = title;
      this.subject = subject;
      this.publisher = publisher;
      this.language = language;
      this.numberOfPages = numberOfPages;
      this.authors = [];
      this.bookItems = [];
    }
  
    getTitle() {
      return this.title;
    }
  
    addAuthor(author) {
      this.authors.push(author);
      author.books.push(this);
    }
  }
  
  class BookItem {
    constructor(barcode, isReferenceOnly = false) {
      this.barcode = barcode;
      this.isReferenceOnly = isReferenceOnly;
      this.borrowed = null;
      this.dueDate = null;
      this.price = 0;
      this.format = BookFormat.HARDCOVER;
      this.status = BookStatus.AVAILABLE;
      this.dateOfPurchase = null;
      this.publicationDate = null;
      this.book = null;
      this.rack = null;
      this.currentBorrower = null;
      this.reservations = [];
    }
  
    checkout() {
      if (this.status === BookStatus.AVAILABLE) {
        this.status = BookStatus.LOANED;
        return true;
      }
      return false;
    }
  }
  
  class Rack {
    constructor(number, locationIdentifier) {
      this.number = number;
      this.locationIdentifier = locationIdentifier;
      this.books = [];
    }
  
    addBook(bookItem) {
      this.books.push(bookItem);
      bookItem.rack = this;
    }
  }
  
  // Account Classes
  class Account {
    constructor(id, password, person) {
      this.id = id;
      this.password = password;
      this.status = AccountStatus.ACTIVE;
      this.person = person;
    }
  
    resetPassword() {
      this.password = "reset" + Math.floor(Math.random() * 1000);
      return true;
    }
  }
  
  class Member extends Account {
    constructor(id, password, person) {
      super(id, password, person);
      this.dateOfMembership = new Date();
      this.totalBooksCheckedOut = 0;
      this.borrowedBooks = [];
      this.reservations = [];
      this.libraryCard = null;
    }
  
    getTotalCheckedoutBooks() {
      return this.totalBooksCheckedOut;
    }
  
    borrowBook(bookItem) {
      if (bookItem.isReferenceOnly || bookItem.status !== BookStatus.AVAILABLE) {
        return false;
      }
  
      bookItem.borrowed = new Date();
      bookItem.dueDate = new Date(new Date().setDate(new Date().getDate() + 14));
      bookItem.status = BookStatus.LOANED;
      bookItem.currentBorrower = this;
  
      this.totalBooksCheckedOut++;
      this.borrowedBooks.push(bookItem);
  
      return true;
    }
  
    returnBook(bookItem) {
      if (!this.borrowedBooks.includes(bookItem)) {
        return false;
      }
  
      bookItem.returnDate = new Date();
      bookItem.borrowed = null;
      bookItem.dueDate = null;
      bookItem.status = BookStatus.AVAILABLE;
      bookItem.currentBorrower = null;
  
      this.totalBooksCheckedOut--;
      this.borrowedBooks = this.borrowedBooks.filter(item => item !== bookItem);
  
      return true;
    }
  
    reserveBook(bookItem) {
      if (bookItem.isReferenceOnly) {
        return false;
      }
  
      const reservation = new BookReservation();
      reservation.bookItem = bookItem;
      reservation.member = this;
  
      bookItem.reservations.push(reservation);
      this.reservations.push(reservation);
  
      if (bookItem.status === BookStatus.AVAILABLE) {
        bookItem.status = BookStatus.RESERVED;
        reservation.status = ReservationStatus.COMPLETED;
      } else {
        reservation.status = ReservationStatus.WAITING;
      }
  
      return true;
    }
  
    cancelReservation(reservation) {
      this.reservations = this.reservations.filter(res => res !== reservation);
      reservation.bookItem.reservations = reservation.bookItem.reservations.filter(res => res !== reservation);
  
      if (reservation.bookItem.status === BookStatus.RESERVED && reservation.bookItem.reservations.length === 0) {
        reservation.bookItem.status = BookStatus.AVAILABLE;
      }
  
      reservation.status = ReservationStatus.CANCELED;
      return true;
    }
  }
  
  class Librarian extends Account {
    constructor(id, password, person) {
      super(id, password, person);
      this.library = null;
    }
  
    addBookItem(bookItem) {
      if (!this.library) {
        return false;
      }
  
      this.library.bookItems.push(bookItem);
      return true;
    }
  
    blockMember(member) {
      if (member.status === AccountStatus.ACTIVE) {
        member.status = AccountStatus.BLACKLISTED;
        return true;
      }
      return false;
    }
  
    unblockMember(member) {
      if (member.status === AccountStatus.BLACKLISTED) {
        member.status = AccountStatus.ACTIVE;
        return true;
      }
      return false;
    }
  }
  
  // Library Classes
  class Library {
    constructor(name, address) {
      this.name = name;
      this.address = address;
      this.bookItems = [];
      this.catalog = new Catalog();
      this.members = [];
      this.librarians = [];
    }
  
    getAddress() {
      return this.address;
    }
  
    addBookItem(bookItem, book) {
      this.bookItems.push(bookItem);
      bookItem.book = book;
      book.bookItems.push(bookItem);
      this.catalog.addBook(book);
    }
  
    registerMember(member) {
      this.members.push(member);
      const card = new LibraryCard();
      card.cardNumber = "LIB-" + Math.floor(Math.random() * 10000);
      card.issuedAt = new Date();
      card.active = true;
      card.member = member;
      member.libraryCard = card;
      return card;
    }
  
    addLibrarian(librarian) {
      this.librarians.push(librarian);
      librarian.library = this;
    }
  }
  
  class LibraryCard {
    constructor() {
      this.cardNumber = "";
      this.barcode = "";
      this.issuedAt = null;
      this.active = false;
      this.member = null;
    }
  
    isActive() {
      return this.active;
    }
  }
  
  class BarcodeReader {
    constructor(id, registeredAt) {
      this.id = id;
      this.registeredAt = registeredAt;
      this.active = true;
    }
  
    isActive() {
      return this.active;
    }
  
    scan(barcode) {
      return barcode;
    }
  }
  
  // Catalog Class
  class Catalog {
    constructor() {
      this.creationDate = new Date();
      this.totalBooks = 0;
      this.bookTitles = new Map();
      this.bookAuthors = new Map();
      this.bookSubjects = new Map();
      this.bookPublicationDates = new Map();
      this.books = [];
    }
  
    addBook(book) {
      this.books.push(book);
      this.totalBooks++;
  
      this.bookTitles.set(book.title, [...(this.bookTitles.get(book.title) || []), book]);
  
      book.authors.forEach(author => {
        this.bookAuthors.set(author.name, [...(this.bookAuthors.get(author.name) || []), book]);
      });
  
      this.bookSubjects.set(book.subject, [...(this.bookSubjects.get(book.subject) || []), book]);
  
      if (book.bookItems.length > 0 && book.bookItems[0].publicationDate) {
        const pubDate = book.bookItems[0].publicationDate.toISOString().split('T')[0];
        this.bookPublicationDates.set(pubDate, [...(this.bookPublicationDates.get(pubDate) || []), book]);
      }
    }
  
    updateCatalog() {
      this.bookTitles.clear();
      this.bookAuthors.clear();
      this.bookSubjects.clear();
      this.bookPublicationDates.clear();
  
      this.books.forEach(book => {
        this.bookTitles.set(book.title, [...(this.bookTitles.get(book.title) || []), book]);
  
        book.authors.forEach(author => {
          this.bookAuthors.set(author.name, [...(this.bookAuthors.get(author.name) || []), book]);
        });
  
        this.bookSubjects.set(book.subject, [...(this.bookSubjects.get(book.subject) || []), book]);
  
        if (book.bookItems.length > 0 && book.bookItems[0].publicationDate) {
          const pubDate = book.bookItems[0].publicationDate.toISOString().split('T')[0];
          this.bookPublicationDates.set(pubDate, [...(this.bookPublicationDates.get(pubDate) || []), book]);
        }
      });
  
      return true;
    }
  }
  
  // Book Reservation and Lending
  class BookReservation {
    constructor() {
      this.creationDate = new Date();
      this.status = ReservationStatus.PENDING;
      this.bookItem = null;
      this.member = null;
    }
  
    getStatus() {
      return this.status;
    }
  
    fetchReservationDetails() {
      return {
        creationDate: this.creationDate,
        status: this.status,
        bookTitle: this.bookItem ? this.bookItem.book.title : null,
        memberName: this.member ? this.member.person.name : null
      };
    }
  }
  
  class BookLending {
    constructor() {
      this.creationDate = new Date();
      this.dueDate = null;
      this.returnDate = null;
      this.bookItem = null;
      this.member = null;
      this.fine = null;
    }
  
    getReturnDate() {
      return this.returnDate;
    }
  
    calculateFine() {
      if (!this.returnDate || !this.dueDate) {
        return 0;
      }
  
      if (this.returnDate <= this.dueDate) {
        return 0;
      }
  
      const daysLate = Math.ceil((this.returnDate - this.dueDate) / (1000 * 60 * 60 * 24));
      return daysLate * 0.5; // $0.50 per day
    }
  }
  
  // Notification System
  class Notification {
    constructor(notificationId, createdOn, content) {
      this.notificationId = notificationId;
      this.createdOn = createdOn;
      this.content = content;
    }
  
    sendNotification() {
      console.log(`Notification #${this.notificationId}: ${this.content}`);
      return true;
    }
  }
  
  class EmailNotification extends Notification {
    constructor(notificationId, createdOn, content, email) {
      super(notificationId, createdOn, content);
      this.email = email;
    }
  
    sendNotification() {
      console.log(`Email sent to ${this.email}: ${this.content}`);
      return true;
    }
  }
  
  class PostalNotification extends Notification {
    constructor(notificationId, createdOn, content, address) {
      super(notificationId, createdOn, content);
      this.address = address;
    }
  
    sendNotification() {
      console.log(`Letter sent to ${this.address.streetAddress}, ${this.address.city}: ${this.content}`);
      return true;
    }
  }
  
  // Fine and Transactions
  class Fine {
    constructor(amount) {
      this.amount = amount;
      this.transactions = [];
    }
  
    getAmount() {
      return this.amount;
    }
  
    addTransaction(transaction) {
      this.transactions.push(transaction);
      transaction.fine = this;
    }
  }
  
  class FineTransaction {
    constructor(creationDate, amount) {
      this.creationDate = creationDate;
      this.amount = amount;
      this.fine = null;
    }
  
    initiateTransaction() {
      console.log(`Transaction initiated for $${this.amount}`);
      return true;
    }
  }
  
  class CreditCardTransaction extends FineTransaction {
    constructor(creationDate, amount, nameOnCard) {
      super(creationDate, amount);
      this.nameOnCard = nameOnCard;
    }
  
    initiateTransaction() {
      console.log(`Credit card transaction initiated for $${this.amount} from ${this.nameOnCard}`);
      return true;
    }
  }
  
  class CheckTransaction extends FineTransaction {
    constructor(creationDate, amount, bankName, checkNumber) {
      super(creationDate, amount);
      this.bankName = bankName;
      this.checkNumber = checkNumber;
    }
  
    initiateTransaction() {
      console.log(`Check transaction initiated for $${this.amount} from ${this.bankName}, check #${this.checkNumber}`);
      return true;
    }
  }
  
  class CashTransaction extends FineTransaction {
    constructor(creationDate, amount, cashTendered) {
      super(creationDate, amount);
      this.cashTendered = cashTendered;
    }
  
    initiateTransaction() {
      const change = this.cashTendered - this.amount;
      console.log(`Cash transaction initiated for $${this.amount}, tendered: $${this.cashTendered}`);
      console.log(`Change due: $${change}`);
      return true;
    }
  }
  
  // Search Interface
  class Search {
    constructor(catalog) {
      this.catalog = catalog;
    }
  
    searchByTitle(title) {
      const titleLower = title.toLowerCase();
      const results = [];
  
      if (this.catalog.bookTitles.has(title)) {
        results.push(...this.catalog.bookTitles.get(title));
      }
  
      this.catalog.books.forEach(book => {
        if (book.title.toLowerCase().includes(titleLower) && !results.includes(book)) {
          results.push(book);
        }
      });
  
      return results;
    }
  
    searchByAuthor(authorName) {
      const authorLower = authorName.toLowerCase();
      const results = [];
  
      if (this.catalog.bookAuthors.has(authorName)) {
        results.push(...this.catalog.bookAuthors.get(authorName));
      }
  
      this.catalog.books.forEach(book => {
        for (const author of book.authors) {
          if (author.name.toLowerCase().includes(authorLower) && !results.includes(book)) {
            results.push(book);
            break;
          }
        }
      });
  
      return results;
    }
  
    searchBySubject(subject) {
      const subjectLower = subject.toLowerCase();
      const results = [];
  
      if (this.catalog.bookSubjects.has(subject)) {
        results.push(...this.catalog.bookSubjects.get(subject));
      }
  
      this.catalog.books.forEach(book => {
        if (book.subject.toLowerCase().includes(subjectLower) && !results.includes(book)) {
          results.push(book);
        }
      });
  
      return results;
    }
  
    searchByPubDate(publishDate) {
      const dateStr = publishDate instanceof Date
        ? publishDate.toISOString().split('T')[0]
        : publishDate;
  
      if (this.catalog.bookPublicationDates.has(dateStr)) {
        return this.catalog.bookPublicationDates.get(dateStr);
      }
  
      return [];
    }
  }
  
  // Simulated library system data
  const librarySystem = {
    books: [
      { barcode: "B001", title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", status: "Available" },
      { barcode: "B002", title: "1984", author: "George Orwell", status: "Available" },
      { barcode: "B003", title: "Animal Farm", author: "George Orwell", status: "Reserved" }
    ],
    members: [],
    currentMember: null
  };

  // Add a member
  function addMember() {
    const name = document.getElementById("memberName").value;
    const email = document.getElementById("memberEmail").value;
    const phone = document.getElementById("memberPhone").value;
  
    if (!name || !email || !phone) {
      document.getElementById("memberStatus").innerHTML = "<p>Please fill all fields.</p>";
      return;
    }
  
    const member = {
      id: `M${librarySystem.members.length + 1}`,
      name,
      email,
      phone,
      booksBorrowed: [],
      reservations: []
    };
  
    librarySystem.members.push(member);
    librarySystem.currentMember = member;
    updateMemberDetails();
    document.getElementById("memberStatus").innerHTML = `<p>Member added: ${name}</p>`;
  }
  
  // Add a book
  function addBook() {
    const title = document.getElementById("bookTitle").value;
    const author = document.getElementById("bookAuthor").value;
    const barcode = document.getElementById("bookBarcode").value;
  
    if (!title || !author || !barcode) {
      document.getElementById("bookStatus").innerHTML = "<p>Please fill all fields.</p>";
      return;
    }
  
    const book = {
      barcode,
      title,
      author,
      status: "Available"
    };
  
    librarySystem.books.push(book);
    document.getElementById("bookStatus").innerHTML = `<p>Book added: ${title}</p>`;
  }
  
  // Search books
  function searchBooks() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const results = librarySystem.books.filter(book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
    displayResults(results);
  }
  
  // Display search results
  function displayResults(results) {
    const resultsDiv = document.getElementById("searchResults");
    if (results.length === 0) {
      resultsDiv.innerHTML = "<p>No books found.</p>";
      return;
    }
    resultsDiv.innerHTML = results.map(book =>
      `<p><strong>${book.title}</strong> by ${book.author} (Status: ${book.status})</p>`
    ).join("");
  }
  
  // Borrow a book
  function borrowBook() {
    const barcode = document.getElementById("borrowBarcode").value;
    const book = librarySystem.books.find(b => b.barcode === barcode);
    const statusDiv = document.getElementById("actionStatus");
  
    if (!book) {
      statusDiv.innerHTML = "<p>Book not found.</p>";
      return;
    }
  
    if (book.status !== "Available") {
      statusDiv.innerHTML = `<p>Cannot borrow: ${book.status}</p>`;
      return;
    }
  
    if (!librarySystem.currentMember) {
      statusDiv.innerHTML = "<p>No member selected.</p>";
      return;
    }
  
    book.status = "Loaned";
    librarySystem.currentMember.booksBorrowed.push(book);
    updateMemberDetails();
    statusDiv.innerHTML = `<p>Successfully borrowed: ${book.title}</p>`;
  }
  
  // Return a book
  function returnBook() {
    const barcode = document.getElementById("borrowBarcode").value;
    const book = librarySystem.books.find(b => b.barcode === barcode);
    const statusDiv = document.getElementById("actionStatus");
  
    if (!book) {
      statusDiv.innerHTML = "<p>Book not found.</p>";
      return;
    }
  
    if (!librarySystem.currentMember || !librarySystem.currentMember.booksBorrowed.includes(book)) {
      statusDiv.innerHTML = "<p>You did not borrow this book.</p>";
      return;
    }
  
    book.status = "Available";
    librarySystem.currentMember.booksBorrowed = librarySystem.currentMember.booksBorrowed.filter(b => b !== book);
    updateMemberDetails();
    statusDiv.innerHTML = `<p>Successfully returned: ${book.title}</p>`;
  }
  
  // Reserve a book
  function reserveBook() {
    const barcode = document.getElementById("reserveBarcode").value;
    const book = librarySystem.books.find(b => b.barcode === barcode);
    const statusDiv = document.getElementById("reserveStatus");
  
    if (!book) {
      statusDiv.innerHTML = "<p>Book not found.</p>";
      return;
    }
  
    if (book.status === "Reserved") {
      statusDiv.innerHTML = "<p>Book is already reserved.</p>";
      return;
    }
  
    if (!librarySystem.currentMember) {
      statusDiv.innerHTML = "<p>No member selected.</p>";
      return;
    }
  
    book.status = "Reserved";
    librarySystem.currentMember.reservations.push(book);
    updateMemberDetails();
    statusDiv.innerHTML = `<p>Successfully reserved: ${book.title}</p>`;
  }
  
  // Update member details
  function updateMemberDetails() {
    if (librarySystem.currentMember) {
      document.getElementById("currentMemberName").textContent = librarySystem.currentMember.name;
      document.getElementById("booksBorrowed").textContent = librarySystem.currentMember.booksBorrowed.length;
      document.getElementById("reservations").textContent = librarySystem.currentMember.reservations.length;
    }
  }
  
  // Initialize member details
  updateMemberDetails();
  