const apiUrl = "https://argf.netlify.app/.netlify/functions/api";

const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="#ffc107" viewBox="0 0 16 16" width="16" height="16"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>`;
const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="#dc3545" viewBox="0 0 16 16" width="16" height="16"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"></path></svg>`;

function sanitizeHTML(str) {
  var temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function formatTextWithLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-left" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M7.364 3.5a.5.5 0 0 1 .5-.5H14.5A1.5 1.5 0 0 1 16 4.5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 14.5V7.864a.5.5 0 1 1 1 0V14.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5H7.864a.5.5 0 0 1-.5-.5"/>
  <path fill-rule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 0 1H1.707l8.147 8.146a.5.5 0 0 1-.708.708L1 1.707V5.5a.5.5 0 0 1-1 0z"/>
</svg>`;
  return text.replace(
    urlRegex,
    `<a href="$1" target="_blank">$1 ${urlLogo}</a>`
  );
}

let currentPage = 1;
const notesPerPage = window.innerWidth <= 768 ? 3 : 5; // Set limit based on screen width

async function fetchNotes(page = 1) {
  try {
    // Tampilkan loader saat memuat data
    document.getElementById("loader").style.display = "block";
    document.getElementById("notes-list").style.display = "none";
    document.getElementById("pagination").innerHTML = "";

    const offset = (page - 1) * notesPerPage;
    const response = await fetch(
      `${apiUrl}/notes?limit=${notesPerPage}&offset=${offset}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    if (!data.notes || !Array.isArray(data.notes)) {
      throw new Error("Invalid data format");
    }
    renderNotes(data.notes);
    renderPagination(data.total, page);
  } catch (error) {
    console.error("Error fetching notes:", error);
  } finally {
    // Sembunyikan loader setelah data dimuat
    document.getElementById("loader").style.display = "none";
    document.getElementById("notes-list").style.display = "block";
  }
}

function renderNotes(notes) {
  const notesList = document.getElementById("notes-list");
  notesList.innerHTML = "";

  if (notes.length === 0) {
    notesList.innerHTML = "<p>Empty</p>";
    return;
  }

  notes.forEach((note) => {
    const formattedTimestamp = formatTimestamp(note.timestamp);
    const sanitizeTitle = sanitizeHTML(note.title);
    const sanitizeDescription = sanitizeHTML(note.description);
    const formattedDescription = formatTextWithLinks(sanitizeDescription);

    notesList.innerHTML += `
      <div class="col">
        <div class="card my-2">
          <div class="card-body">
            <h5 class="card-title">${sanitizeTitle}</h5>
            <blockquote>${formattedTimestamp}</blockquote>
            <p class="card-text">${formattedDescription}</p>
            <button class="btn btn-outline-primary btn-edit" data-id="${note.id}" data-title="${note.title}" data-description="${note.description}" onclick="openEditModal(this)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" fill="#0d6efd"></path>
              </svg>
            </button>
            <button class="btn btn-outline-warning btn-copy" onclick="copyDescription(this)">${copyIcon}</button>
            <button class="btn btn-outline-danger btn-delete" data-id="${note.id}" onclick="deleteNoteHandler(this)">${trashIcon}</button>
          </div>
        </div>
      </div>
    `;
  });
}

function renderPagination(total, currentPage) {
  const pagination = document.getElementById("pagination");
  const totalPages = Math.ceil(total / notesPerPage);

  pagination.innerHTML = `
    <nav aria-label="Page navigation example">
      <ul class="pagination justify-content-center">
        <li class="page-item text-secondary ${currentPage === 1 ? "disabled" : ""}">
          <a class="page-link" href="#" onclick="fetchNotes(${currentPage - 1})">
            <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" fill="${currentPage === 1 ? "grey" : "white"}" viewBox="0 0 16 16" width="16" height="16"><path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"></path></svg>
          </a>
        </li>
        ${Array.from({ length: totalPages }, (_, i) => `
          <li class="page-item ${i + 1 === currentPage ? "active text-underline" : ""}">
            <a class="page-link" href="#" onclick="fetchNotes(${i + 1})">${i + 1}</a>
          </li>
        `).join("")}
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
          <a class="page-link" href="#" onclick="fetchNotes(${currentPage + 1})">
            <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" fill="${currentPage === totalPages ? "grey" : "white"}" viewBox="0 0 16 16" width="16" height="16"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path></svg>
          </a>
        </li>
      </ul>
    </nav>
  `;
}

document.getElementById("showAddNoteModalBtn").addEventListener("click", () => {
  const addNoteModal = new bootstrap.Modal(
    document.getElementById("addNoteModal")
  );
  addNoteModal.show();
});

document
  .getElementById("addNoteModal")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    // Ambil elemen tombol dan loader
    const addNoteBtn = document.getElementById("add-note-btn");
    addNoteBtn.style.display = "none"; // Sembunyikan tombol
    const loaderButton = document.getElementById("loader-button");
    loaderButton.style.display = "block"; // Tampilkan loader

    const title = document
      .getElementById("modal-title")
      .value.replace(/\n/g, "<br>");
    const description = document
      .getElementById("modal-description")
      .value.replace(/\n/g, "<br>");
    try {
      const response = await fetch(`${apiUrl}/add-notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });
      if (response.ok) {
        document.getElementById("modal-title").value = "";
        document.getElementById("modal-description").value = "";
        fetchNotes();
        const addNoteModal = bootstrap.Modal.getInstance(
          document.getElementById("addNoteModal")
        );
        addNoteModal.hide();
      } else {
        console.error("Error adding note:", response.statusText);
      }
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      // Sembunyikan loader dan kembalikan teks tombol
      loaderButton.style.display = "none"; // Tampilkan loader
      addNoteBtn.style.display = "block"; // Sembunyikan tombol
    }
  });

//copy

function copyDescription(button) {
  const cardBody = button.closest(".card-body");
  const description = cardBody.querySelector(".card-text").textContent;

  const textArea = document.createElement("textarea");
  textArea.value = description;
  document.body.appendChild(textArea);

  textArea.select();
  textArea.setSelectionRange(0, 99999);

  document.execCommand("copy");
  document.body.removeChild(textArea);

  // Ubah nama tombol menjadi "Copied!" selama 2 detik
  button.textContent = "Copied!";
  setTimeout(() => {
    button.innerHTML = copyIcon;
  }, 2000);
}

// Search notes
let searchTimeout;

document.getElementById("query").addEventListener("input", function (event) {
  clearTimeout(searchTimeout); // Bersihkan penundaan sebelumnya (jika ada)
  const query = event.target.value.trim(); // Ambil nilai pencarian dan hapus spasi di awal dan akhir
  if (query) {
    searchTimeout = setTimeout(() => {
      searchNotes(query);
    }, 500); // Set penundaan 500ms sebelum melakukan pencarian
  } else {
    // Jika input kosong, kembalikan ke daftar catatan default
    fetchNotes();
  }
});

async function searchNotes(query) {
  try {
    const response = await fetch(`${apiUrl}/search-note?query=${query}`);
    const data = await response.json();
    const notesList = document.getElementById("notes-list");
    notesList.innerHTML = "";
    data.forEach((note) => {
      const formattedTimestamp = formatTimestamp(note.timestamp);
      const sanitizeTitle = sanitizeHTML(note.title);
      const sanitizeDescription = sanitizeHTML(note.description);
      const formattedDescription = formatTextWithLinks(sanitizeDescription);
      notesList.innerHTML += `
            <div class="col">
                <div class="card my-2">
                    <div class="card-body">
                        <h5 class="card-title">${sanitizeTitle}</h5>
                        <blockquote>${formattedTimestamp}</blockquote>
                        <p class="card-text">${formattedDescription}</p>
                        <button class="btn btn-outline-primary btn-edit" data-id="${note.id}" data-title="${note.title}" data-description="${note.description}" onclick="openEditModal(this)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" fill="#0d6efd"></path></svg>
                      </svg>
                      </button>
                        <button class="btn btn-outline-warning btn-copy" onclick="copyDescription(this)">${copyIcon}</button>
                        <button class="btn btn-outline-danger btn-delete" data-id="${note.id}" onclick="deleteNoteHandler(this)">${trashIcon}</button>
                    </div>
                </div>
            </div>
          `;
    });
  } catch (error) {
    console.error("Error searching notes:", error);
  }
}

function openEditModal(button) {
  const noteId = button.getAttribute("data-id");
  const noteTitle = button.getAttribute("data-title");
  const noteDescription = button.getAttribute("data-description");

  document.getElementById("edit-id").value = noteId;
  document.getElementById("edit-title").value = noteTitle;
  document.getElementById("edit-description").value = noteDescription;

  const editModal = new bootstrap.Modal(
    document.getElementById("editNoteModal")
  );
  editModal.show();
}

document
  .getElementById("edit-note-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const id = document.getElementById("edit-id").value;
    const title = document.getElementById("edit-title").value;
    const description = document.getElementById("edit-description").value;
    try {
      const response = await fetch(`${apiUrl}/edit-notes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });
      if (response.ok) {
        fetchNotes();
        const editModal = bootstrap.Modal.getInstance(
          document.getElementById("editNoteModal")
        );
        editModal.hide();
      } else {
        console.error("Error editing note:", response.statusText);
      }
    } catch (error) {
      console.error("Error editing note:", error);
    }
  });

async function deleteNoteHandler(button) {
  try {
    const noteId = button.getAttribute("data-id");

    // Tampilkan pesan konfirmasi menggunakan SweetAlert
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      textColor: "white",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      background: "#1F2937", // Set background color
    });

    if (result.isConfirmed) {
      console.log(`Deleting note with ID: ${noteId}`);
      const response = await fetch(`${apiUrl}/delete-notes/${noteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        console.log("Note deleted successfully");
        fetchNotes();
      } else {
        const errorData = await response.json();
        console.error("Error deleting note:", errorData.error);
      }
    }
  } catch (error) {
    console.error("Error deleting note:", error);
  }
}

// Panggil fungsi deleteNoteHandler menggunakan ID dari atribut data-id tombol delete
document.querySelectorAll(".btn-delete").forEach((button) => {
  button.addEventListener("click", () => {
    const noteId = button.getAttribute("data-id");
    deleteNoteHandler(noteId);
  });
});

// Fetch all notes on page load
fetchNotes();
