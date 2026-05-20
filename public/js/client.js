let typingTimeout;

//creating socket connection
const socket = io.connect("http://localhost:3000");

//getting username from prompt
const username = prompt("Enter Your Name");
if (!username) {
  alert("Username required");
  location.reload();
}

//prevent empty username
// while (!username || username.trim() === "") {
//   username = prompt("username cannot be empty. Enter you name");
// }

//sending username to server
socket.emit("new_user", username);

//showing welcome message to user
const welcomeMessage = document.getElementById("welcome-message");
welcomeMessage.innerHTML = `Welcome, ${username} 👋`;

//getting html elements
const messageContainer = document.getElementById("message-container");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

const onlineUsersContainer = document.getElementById("online-users");

const typingIndicator = document.getElementById("typing-indicator");

//===>detecting typing
messageInput.addEventListener("input", () => {
  socket.emit("typing", username);
});

//
//
//===>sending message by using click event
sendBtn.addEventListener("click", () => {
  const message = messageInput.value;

  //preventing empty messages
  if (!message) {
    alert("type you message");
    return;
  }

  //creating sender message element
  const messageElement = document.createElement("div");

  messageElement.classList.add("d-flex", "justify-content-end", "mb-2");

  messageElement.innerHTML = `
  <div class="bg-success text-white p-2 rounded text-end" style = "max-width : 50%; word-wrap: break-word;">
  <strong>you</strong><br>
  ${message}<br>
  <small>${new Date().toLocaleTimeString()}</small><br>
  </div>
`;

  messageContainer.appendChild(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight; //auto scroll to (bottom) means stays at new message
  //sending message to server
  socket.emit("new_message", message);

  //clearing input field after sending message
  messageInput.value = "";
});

//
//
//===>receiving data from broadcasted message
socket.on("broadcasting_message", (userMessage) => {
  const { username, message, timestamp } = userMessage;

  //creating message element
  const messageElement = document.createElement("div");
  messageElement.classList.add("d-flex", "justify-content-start", "mb-2");
  messageElement.innerHTML = `
    <div class="bg-secondary text-white p-2 rounded mb-2 text-start" style = "max-width : 50%; word-wrap: break-word;">
    <strong>${username}</strong><br>
    ${message}<br>
    <small>${new Date().toLocaleTimeString()}</small><br>
    </div>
    `;

  //adding message to the message container
  messageContainer.appendChild(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight; //auto scroll to (bottom) means stays at new message
});

//
//
//===>receiving old messages
socket.on("old_messages", (oldMessages) => {
  oldMessages.forEach((message) => {
    const messageElement = document.createElement("div");

    const isCurrentUser = message.username === username;

    messageElement.classList.add(
      "d-flex",
      isCurrentUser ? "justify-content-end" : "justify-content-start",
      "mb-2",
    );

    messageElement.innerHTML = `
      <div class="${
        isCurrentUser
          ? "bg-success text-white text-end"
          : "bg-secondary text-white text-start"
      } p-2 rounded"
      style="max-width: 50%; word-wrap: break-word;">
        <strong>
          ${isCurrentUser ? "You" : message.username}
        </strong><br>

        ${message.message}<br>
        <small>
          ${new Date(message.timestamp).toLocaleTimeString()}
        </small><br>

      </div>
    `;

    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight; //auto scroll to (bottom) means stays at new message
  });
});

//
//
//===> receiving online users
socket.on("online_users", (users) => {
  //clearing previous users
  onlineUsersContainer.innerHTML = "";

  users.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.classList.add("bg-secondary", "p-2", "rounded", "mb-2");

    userElement.innerHTML = `🟢 ${user}, (online)`;
    onlineUsersContainer.appendChild(userElement);
  });
});

//
//
//===> receive typing event
socket.on("show_typing", (username) => {
  typingIndicator.innerText = `${username} is typing...`;

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    typingIndicator.innerText = "";
  }, 800);
});

//
//
//
//===> receiving join notification
socket.on("user_joined", (username) => {
  console.log("joined event received");
  const joinMessage = document.createElement("div");

  joinMessage.classList.add("text-center", "text-success", "mb-2");

  joinMessage.innerText = `${username} joined the chat`;

  messageContainer.appendChild(joinMessage);
  messageContainer.scrollTop = messageContainer.scrollHeight; //auto scroll to (bottom) means stays at new message
});

//
//
//
//===> receiving leave notification
socket.on("user_left", (username) => {
  console.log("left event received");
  const leaveMessage = document.createElement("div");

  leaveMessage.classList.add("text-center", "text-danger", "mb-2");

  leaveMessage.innerText = `${username} left the chat`;

  messageContainer.appendChild(leaveMessage);
  messageContainer.scrollTop = messageContainer.scrollHeight; //auto scroll to (bottom) means stays at new message
});
