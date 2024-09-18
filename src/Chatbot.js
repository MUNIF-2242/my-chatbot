import React, { useState, useEffect } from "react";
import axios from "axios";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState("");
  const [waitingForName, setWaitingForName] = useState(true);

  // Helper function to detect if input is a date
  const isDate = (text) => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/; // Example: YYYY-MM-DD
    return datePattern.test(text);
  };

  // Initialize chat with a greeting message from the bot
  useEffect(() => {
    const greetUser = async () => {
      const initialMessage = "Hi there! I'm your assistant. What's your name?";
      setMessages([{ text: initialMessage, sender: "bot" }]);
    };

    greetUser();
  }, []);

  const sendMessage = async () => {
    if (input.trim() === "") return;

    // Display user message in the chat
    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);

    if (waitingForName) {
      // If the bot is waiting for the user's name
      setUserName(input);
      setWaitingForName(false);
      try {
        const response = await axios.post(
          "http://localhost:3000/dev/lex/fulfillment",
          {
            currentIntent: {
              name: "GreetUser",
              slots: {
                UserName: input,
              },
            },
          }
        );

        // Log the full response for debugging
        console.log("Response from Lex:", response);

        // Handle the response from Lex and update the chatbot UI
        const lexMessage = response.data.dialogAction.message.content;
        setMessages([...newMessages, { text: lexMessage, sender: "bot" }]);
        setInput(""); // Clear the input box
      } catch (error) {
        console.error(
          "Error sending message:",
          error.response || error.message || error
        );
        setMessages([
          ...newMessages,
          {
            text: "Sorry, something went wrong. Please try again.",
            sender: "bot",
          },
        ]);
      }
    } else {
      // If the bot is not waiting for the user's name
      const isInputDate = isDate(input);
      const intentName = isInputDate ? "GetTodosForDate" : "GetTodosByKeyword";
      const slotName = isInputDate ? "TodoDate" : "Keyword";

      try {
        const response = await axios.post(
          "http://localhost:3000/dev/lex/fulfillment",
          {
            currentIntent: {
              name: intentName,
              slots: {
                [slotName]: input,
              },
            },
          }
        );

        // Log the full response for debugging
        console.log("Response from Lex:", response);

        // Handle the response from Lex and update the chatbot UI
        const lexMessage = response.data.dialogAction.message.content;
        setMessages([...newMessages, { text: lexMessage, sender: "bot" }]);
        setInput(""); // Clear the input box
      } catch (error) {
        console.error(
          "Error sending message:",
          error.response || error.message || error
        );
        setMessages([
          ...newMessages,
          {
            text: "Sorry, something went wrong. Please try again.",
            sender: "bot",
          },
        ]);
      }
    }
  };

  return (
    <div className="chatbot">
      <div className="messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.sender === "user" ? "message user" : "message bot"}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-box">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
