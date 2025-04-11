// const apiURL = "https://mediminder457.pythonanywhere.com";
// const apiURL = "http://127.0.0.1:5000";
// const apiURL = "https://mediminder-backend.vercel.app";
const apiURL = "http://api.mediminder.site";

// const socket = io(apiURL);
// socket.on("records_updated", (data) => {
//   if (data) window.location.reload();
// });

document.getElementById("createUserForm").onsubmit = (e) => {
  createUser(e);
};

function createUser(e) {
  e.preventDefault();

  const createUserForm = document.getElementById("createUserForm");

  // Create a FormData object to send the form data including the file
  let data = new FormData(createUserForm);
  console.log(data);

  // Create a new XMLHttpRequest object to send the data
  let postRequest = new XMLHttpRequest();
  postRequest.open("POST", `${apiURL}/create_user`, true);

  postRequest.onload = () => {
    if (postRequest.status === 200) {
        console.log(postRequest.responseText); // Success response
      document.getElementById("createUserForm").reset(); // Reset the form
      window.location.reload();
    } else {
      alert("An error occurred: " + patchRequest.statusText); // Error response
    }
  };

  postRequest.send(data);
}

// Fetch users from the API
function fetchUsers() {
  fetch(`${apiURL}/fetch_users`) // Make a GET request
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse the response as JSON
    })
    .then((userList) => {
      console.log("Fetched users:", userList);
      displayUsers(userList); // Call a function to handle the users data
    })
    .catch((error) => {
      console.error("Error fetching users:", error);
    });
}

// Display the fetched users in the DOM
function displayUsers(userList) {
  // Clear previous users
  const displayUser = document.getElementById("displayUser");
  displayUser.innerHTML = "";

  // Loop through the users and add them to the page
  userList.forEach((user) => {
    addUserElements(user.id, user.name, user.img_name, user.status);
    fetchPockets(user.id, user.status);
  });
}

// Add elements for each user
function addUserElements(id, name, imgName, status) {
  const displayUser = document.getElementById("displayUser");

  // Create the HTML string with the necessary content
  const userHTML = `
    <div class="user" id="user${id}">
        <div class="user__info">
            <div class="user__details">
                <img src="${apiURL}/get_image/${imgName}" alt="Profile Picture">
                <h3>${name}</h3>
                <div class="user__btns" id="user__btns${id}">
                    <button onclick="updateUser(event, ${id}, '${name}')">Edit</button>
                    <button onclick="deleteUser(event, ${id}, '${status}')">Delete</button>
                </div>
            </div>
        </div>
        <div class="user__log" id="user__log${id}"></div>
    </div>
    `;

  // Append the HTML string to the container
  displayUser.innerHTML += userHTML; // Use += to append, not overwrite

  const statusButton = document.createElement("button");
  statusButton.setAttribute("onclick", `setActive(event, ${id})`);
  document.getElementById(`user__btns${id}`).appendChild(statusButton);

  if (status === "Active") {
    statusButton.textContent = "Active";
    statusButton.disabled = true;
  } else {
    statusButton.textContent = "Set as Active";
    statusButton.disabled = false;
  }
}

function displayPockets(id, userStatus, pocketList) {
  // Loop through the users and add them to the page
  pocketList.forEach((pocket) => {
    addPocketElements(
      id,
      userStatus,
      pocket.uid,
      pocket.legend,
      pocket.label,
      pocket.start,
      pocket.hour,
      pocket.min,
      pocket.status
    );
    fetchRecords(id, pocket.legend, pocket.uid);
  });

  const userLog = document.getElementById(`user__log${id}`);

  const userLogBtnsHTML = `
    <div class="user__log--btns">
        <button id="user__log--btn${id}A" class="active">A</button>
        <button id="user__log--btn${id}B">B</button>
        <button id="user__log--btn${id}C">C</button>
        <button id="user__log--btn${id}D">D</button>
        <button id="user__log--btn${id}E">E</button>
    </div>
  `;

  userLog.insertAdjacentHTML("beforeend", userLogBtnsHTML);

  const tabs = userLog.querySelectorAll(".user__log--btns button");
  const contents = userLog.querySelectorAll(`.group${id}`);

  const grpLegend = ["A", "B", "C", "D", "E"];

  // Add the 'active' class to the first content by default
  const firstGroup = userLog.querySelector(
    `#user__log--group${id}${grpLegend[0]}`
  );
  firstGroup.classList.add("active");

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs

      tabs.forEach((tab) => {
        tab.classList.remove("active");
      });

      // Add active class to the clicked tab
      tab.classList.add("active");

      // Remove active class from all contents

      contents.forEach((content) => {
        content.classList.remove("active");
      });

      // Add active class to the corresponding content
      const activeContent = userLog.querySelector(
        `#user__log--group${id}${grpLegend[i]}`
      );
      activeContent.classList.add("active");
    });
  });
}

function convertTo12HourFormat(time) {
  let [hour, minute] = time.split(":"); // Split time into hour and minute
  hour = parseInt(hour); // Convert the hour to an integer for comparison

  let ampm = "AM"; // Default AM
  if (hour >= 12) {
    ampm = "PM"; // If hour is 12 or more, it's PM
    if (hour > 12) {
      hour -= 12; // Convert to 12-hour format
    }
  } else if (hour === 0) {
    hour = 12; // Midnight is 12 AM
  }

  // Format the hour and minute in 12-hour format
  return `${hour}:${minute} ${ampm}`;
}

function formatTakenTime(taken) {
  // Remove GMT, split the date and time, and keep both
  let parts = taken.replace("GMT", "").trim().split(" ");

  // Reformat time and keep the date part
  let formattedTime = convertTo12HourFormat(parts[4]);
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]} ${formattedTime}`;
}

function addPocketElements(
  id,
  userStatus,
  uid,
  legend,
  label,
  start,
  hour,
  min,
  status
) {
  let [date, time] = ["", ""];
  let formattedTime = "";
  let step = "";

  if (start != "") {
    [date, time] = start.split(" ");
    formattedTime = convertTo12HourFormat(time);
  }

  if (hour != 0 || min != 0) {
    step = `${hour}hr : ${min}min`;
  }

  let stat = 0;
  if (status == "Deactivated") {
    stat = 1;
  }

  const userLog = document.getElementById(`user__log${id}`);

  const userLogGroupHTML = `
    <div class="user__log--group group${id}" id="user__log--group${id}${legend}">
        <h4 class="user__log--title">${label} <button onclick="renameLabel(event, ${uid}, '${label}')">Rename</button></h4>
        <div class="user__log--details">
            <p>Start Date: <small id=date-${uid}>${date}</small></p>
            <p>Start Time: <small id=time-${uid}>${formattedTime}</small></p>
            <p>Step: ${step}</p>
            <button onclick="setSched(event, ${uid}, '${date}', '${time}', '${hour}', '${min}')">Edit</button>
            <button id="activateSchedBtn${uid}" onclick="activateSched(event, ${uid}, ${stat})" class="activateSchedBtn">${status}</button>
        </div>
        <div class="user__log--head">
            <p>DRUG</p>
            <p>DATE</p>
            <p>SCHEDULE</p>
            <p>TIME TAKEN</p>
            <p>STATUS</p>
        </div>
        <div class="user__log--body" id="user__log--body${id}${legend}"></div>
    </span>
    `;

  // Safely append the new HTML
  userLog.insertAdjacentHTML("beforeend", userLogGroupHTML);

  const activateSchedBtn = document.getElementById(`activateSchedBtn${uid}`);

  if (status === "Activated") {
    activateSchedBtn.classList.add("active");
  } else {
    activateSchedBtn.classList.remove("active");
  }

  if (userStatus === "Active") {
    activateSchedBtn.disabled = false;
  } else {
    activateSchedBtn.disabled = true;
  }
}

function fetchPockets(id, userStatus) {
  fetch(`${apiURL}/fetch_pockets/${id}`) // Make a GET request
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse the response as JSON
    })
    .then((pocketList) => {
      if (!pocketList || pocketList.length === 0) {
        console.warn(`No pockets found for user ID ${id}`);
        return;
      }
      console.log("Fetched pockets:", pocketList);
      displayPockets(id, userStatus, pocketList); // Display pockets for the user
    })
    .catch((error) => {
      console.error(`Error fetching pockets for user ID ${id}:`, error);
    });
}

function updateUser(e, id, name) {
  e.preventDefault();

  openUpdateModal(name);

  const updateUserForm = document.getElementById("updateUserForm");

  // Handle form submission
  updateUserForm.onsubmit = (event) => {
    event.preventDefault();

    const data = new FormData(updateUserForm);
    const patchRequest = new XMLHttpRequest();
    patchRequest.open("PATCH", `${apiURL}/update_user/${id}`, true);

    patchRequest.onload = () => {
      if (patchRequest.status === 200) {
        // alert("User updated successfully!");
        closeModal();
        window.location.reload();
      } else {
        alert("An error occurred: " + patchRequest.statusText);
      }
    };

    patchRequest.send(data);
  };
}

function deleteUser(e, id, status) {
  e.preventDefault();

  if (status !== "Active") {
    openDeleteModal(id);

    const deleteUserForm = document.getElementById("deleteUserForm");

    // Handle form submission
    deleteUserForm.onsubmit = (event) => {
      event.preventDefault();

      const deleteRequest = new XMLHttpRequest();
      deleteRequest.open("DELETE", `${apiURL}/delete_user/${id}`, true);

      deleteRequest.onload = () => {
        if (deleteRequest.status === 200) {
          // alert("User deleted successfully!");
          closeModal();
          window.location.reload();
        } else {
          alert("An error occurred: " + deleteRequest.statusText);
        }
      };

      deleteRequest.send();
    };
  } else {
    alert("You cannot delete this user. This user is ACTIVE");
  }
}

function renameLabel(e, uid, name) {
  e.preventDefault();

  openRenameLabelModal(name);

  const renameLabelForm = document.getElementById("renameLabelForm");

  // Handle form submission
  renameLabelForm.onsubmit = (event) => {
    event.preventDefault();

    const data = new FormData(renameLabelForm);
    const patchRequest = new XMLHttpRequest();
    patchRequest.open("PATCH", `${apiURL}/rename_label/${uid}`, true);

    patchRequest.onload = () => {
      if (patchRequest.status === 200) {
        // alert("Medication renamed successfully!");
        closeModal();
        activateSched(e, uid, 0);
        window.location.reload();
      } else {
        alert("An error occurred: " + patchRequest.statusText);
      }
    };

    patchRequest.send(data);
  };
}

function setSched(e, uid, date, time, hour, min) {
  e.preventDefault();

  openSetSchedModal(date, time, hour, min);

  const setSchedForm = document.getElementById("setSchedForm");

  // Handle form submission
  setSchedForm.onsubmit = (event) => {
    event.preventDefault();

    const data = new FormData(setSchedForm);
    const patchRequest = new XMLHttpRequest();
    patchRequest.open("PATCH", `${apiURL}/set_sched/${uid}`, true);

    patchRequest.onload = () => {
      if (patchRequest.status === 200) {
        // alert("Schedule set successfully!");
        closeModal();
        window.location.reload();
      } else {
        alert("An error occurred: " + patchRequest.statusText);
      }
    };

    patchRequest.send(data);
  };
}

function activateSched(e, uid, stat) {
  e.preventDefault();

  // Get date and time inputs
  const dateInput = document.getElementById(`date-${uid}`);
  const timeInput = document.getElementById(`time-${uid}`);

  // Validate date and time
  if (
    !dateInput ||
    !timeInput ||
    !dateInput.textContent ||
    !timeInput.textContent
  ) {
    alert("Please set both date and time before activating the schedule.");
    return;
  }

  // Proceed with activation request
  const patchRequest = new XMLHttpRequest();
  patchRequest.open("PATCH", `${apiURL}/toggle_sched/${uid}/${stat}`, true);

  patchRequest.onload = () => {
    if (patchRequest.status === 200) {
      window.location.reload();
    } else {
      alert("An error occurred: " + patchRequest.statusText);
    }
  };

  patchRequest.send();
}

// Functions to open the modal
function openUpdateModal(name) {
  // Check if the modal already exists
  if (!document.querySelector(".modal")) {
    const modalHTML = `
      <div class="modal">
          <div class="backdrop" onclick="closeModal()"></div>
          <form id="updateUserForm" class="userForm update">
              <h2 id="closeUpdateUserForm" class="closeUserForm" onclick="closeModal()">&times;</h2>
              <label>Name: <input type="text" id="updatedUserName" name="updatedUserName" placeholder="Enter name" value="${name}" required/></label>
              <input type="file" id="updatedUserImg" name="updatedUserImg" />
              <button type="submit">Update</button>
          </form>
      </div>
    `;

    // Insert modal into the DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

function openDeleteModal() {
  if (!document.querySelector(".modal")) {
    const modalHTML = `
        <div class="modal">
            <div class="backdrop" onclick="closeModal()"></div>
            <form id="deleteUserForm" class="userForm delete">
                <h2 id="closeDeleteUserForm" class="closeUserForm" onclick="closeModal()">&times;</h2>
                <p>Are you sure you want to delete this user?</p>
                <button type="submit">Yes</button>
                <button onclick="closeModal()">No</button>
            </form>
        </div>
    `;

    // Insert modal into the DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

function openRenameLabelModal(name) {
  if (!document.querySelector(".modal")) {
    const modalHTML = `
        <div class="modal">
            <div class="backdrop" onclick="closeModal()"></div>
            <form id="renameLabelForm" class="userForm label">
                <h2 id="closeRenameLabelForm" class="closeUserForm" onclick="closeModal()">&times;</h2>
                <p>Medication Name:</p>
                <input type="text" id="renameLabel" name="renameLabel" value="${name}"/>
                <button type="submit">Submit</button>
            </form>
        </div>
    `;

    // Insert modal into the DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

function openSetSchedModal(date, time, hour, min) {
  if (!document.querySelector(".modal")) {
    // Get current date and time
    const now = new Date();

    // Ensure date format is consistent in YYYY-MM-DD (fixes timezone issue)
    const today = now.toLocaleDateString("en-CA");

    // Get the current time and add 10 minutes
    now.setMinutes(now.getMinutes() + 1);
    const futureHours = String(now.getHours()).padStart(2, "0");
    const futureMinutes = String(now.getMinutes()).padStart(2, "0");
    const futureTime = `${futureHours}:${futureMinutes}`;

    // Ensure min is at least 1
    min = Math.max(1, min || 1);

    const modalHTML = `
        <div class="modal">
            <div class="backdrop" onclick="closeModal()"></div>
            <form id="setSchedForm" class="userForm sched">
                <h2 id="closeSetSchedForm" class="closeUserForm" onclick="closeModal()">&times;</h2>
                <p>Date:</p>
                <input type="date" id="setDate" name="setDate" value="${today}" min="${today}"/>
                <p>Time:</p>
                <input type="time" id="setTime" name="setTime" value="${futureTime}" min="${futureTime}"/>
                <p>Step:</p>
                <input class="step" type="number" id="setHour" name="setHour" value="${hour}" min="0"/>
                <small>:</small> 
                <input class="step" type="number" id="setMin" name="setMin" value="${min}" min="1"/>
                <button type="submit">Submit</button>
            </form>
        </div>
    `;

    // Insert modal into the DOM
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

// Function to close the modal
function closeModal() {
  const modal = document.querySelector(".modal");
  if (modal) modal.remove();
}

function setActive(e, id) {
  e.preventDefault();

  const patchRequest = new XMLHttpRequest();
  patchRequest.open("PATCH", `${apiURL}/set_active/${id}`, true);

  patchRequest.onload = () => {
    if (patchRequest.status === 200) {
      window.location.reload();
    } else {
      alert("An error occurred: " + patchRequest.statusText);
    }
  };

  patchRequest.send();
}

function fetchRecords(id, legend, uid) {
  fetch(`${apiURL}/fetch_records/${uid}`) // Make a GET request
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse the response as JSON
    })
    .then((recordList) => {
      if (!recordList || recordList.length === 0) {
        console.log(`No records found for pocket ${id}${legend}`);
        return;
      }
      console.log("Fetched records:", recordList);
      displayRecords(id, legend, recordList); // Display records for the user
    })
    .catch((error) => {
      console.error(`Error fetching records for pocket UID ${uid}:`, error);
    });
}

function displayRecords(id, legend, recordList) {
  // Loop through the records and add them to the page
  recordList.forEach((record) => {
    addRecordElements(
      id,
      legend,
      record.uuid,
      record.label,
      record.sched,
      record.taken,
      record.status
    );
  });
}

function addRecordElements(id, legend, uuid, label, sched, taken, status) {
  const [date, time] = sched.split(" ");
  formattedTime = convertTo12HourFormat(time);

  if (!taken) {
    taken = "";
  } else {
    taken = formatTakenTime(taken);
  }

  if (!status) {
    status = "";
  }

  const userLogBody = document.getElementById(`user__log--body${id}${legend}`);

  const userLogDataHTML = `
    <div class="user__log--data">
        <p>${label}</p>
        <p>${date}</p>
        <p>${formattedTime}</p>
        <p>${taken}</p>
        <p>${status}</p>
    </div>
    `;

  // Safely append the new HTML
  userLogBody.insertAdjacentHTML("beforeend", userLogDataHTML);
}

// Trigger the fetch operation
fetchUsers();

