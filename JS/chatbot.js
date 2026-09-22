$(document).ready(function () {
    if ($("#flexbot-toggle-btn").length === 0) {
        return;
    }

    $(document).on("click", "#flexbot-toggle-btn", function () {
        toggleChatbot();
    });

    $(document).on("click", "#flexbot-close-btn", function () {
        closeChatbot();
    });

    $(document).on("click", "#flexbot-clear-btn", function () {
        resetChatMessages();
    });

    $(document).on("click", ".flexbot-chip", function () {
        const prompt = $(this).attr("data-prompt") || $(this).text().trim();
        $("#chat-input").val(prompt);
        handleUserMessage();
    });

    $(document).on("click", "#send-btn", function (e) {
        e.preventDefault();
        handleUserMessage();
    });

    $(document).on("submit", "#flexbot-form", function (e) {
        e.preventDefault();
        handleUserMessage();
    });

    $(document).on("keypress", "#chat-input", function (e) {
        if (e.which === 13) {
            e.preventDefault();
            handleUserMessage();
        }
    });
});

function toggleChatbot() {
    const $window = $("#flexbot-window");
    if ($window.hasClass("active") || $window.is(":visible")) {
        closeChatbot();
    } else {
        openChatbot();
    }
}

function openChatbot() {
    const $window = $("#flexbot-window");
    $window.addClass("active").fadeIn(200, function () {
        $("#chat-input").focus();
        scrollChatToBottom();
    });
}

function closeChatbot() {
    const $window = $("#flexbot-window");
    $window.fadeOut(200, function () {
        $window.removeClass("active");
    });
}

function resetChatMessages() {
    const chatContainer = $("#chat-messages");
    chatContainer.html(`
        <div class="flexbot-msg flexbot-msg-bot">
            <div class="flexbot-msg-avatar">🤖</div>
            <div class="flexbot-msg-content">
                <p>Hello! 👋 I'm <strong>FlexBot</strong>, your personal AI fitness assistant.</p>
                <p>How can I help you today? Feel free to ask about our memberships, workout plans, trainers, or store supplements!</p>
            </div>
        </div>
    `);
    scrollChatToBottom();
}

const ChatbotService = {
    askChatbot: function(message, onSuccess, onError) {
        $.ajax({
            url: "http://localhost:8080/api/chatbot/ask",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                message: message
            }),
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem("JWT") || '')
            },
            success: function(response) {
                console.log("Chatbot response:", response);
                let reply = "";
                if (response && response.body && response.body.reply !== undefined) {
                    reply = response.body.reply;
                } else if (response && response.body !== undefined && typeof response.body === "string") {
                    reply = response.body;
                } else if (response && response.data && response.data.reply !== undefined) {
                    reply = response.data.reply;
                } else if (response && response.reply !== undefined) {
                    reply = response.reply;
                } else if (response && response.message && !response.message.toLowerCase().includes("operation successful")) {
                    reply = response.message;
                } else {
                    reply = response;
                }
                if (typeof onSuccess === "function") onSuccess(reply, response);
            },
            error: function(xhr, status, error) {
                console.error("Chatbot error:", xhr.status, error);
                if (typeof onError === "function") onError(xhr, status, error);
            }
        });
    }
};

window.ChatbotService = ChatbotService;

function handleUserMessage() {
    const inputField = $("#chat-input");
    const userMessage = inputField.val().trim();

    if (!userMessage) return;

    appendChatMessage("user", userMessage);
    inputField.val("");

    const loadingId = appendTypingIndicator();

    ChatbotService.askChatbot(
        userMessage,
        function (botReply) {
            removeTypingIndicator(loadingId);

            if (typeof botReply === "string" && (botReply.includes("429") || botReply.includes("RESOURCE_EXHAUSTED") || botReply.includes("Quota exceeded"))) {
                appendChatMessage("bot", "⚠️ **Gemini AI Rate Limit (429):** Free tier request quota reached. Please wait about 1 minute and try again.");
            } else {
                appendChatMessage("bot", botReply);
            }
        },
        function (xhr) {
            removeTypingIndicator(loadingId);
            console.error("Chatbot Error:", xhr);

            if (xhr && xhr.status === 429) {
                appendChatMessage("bot", "⚠️ **Gemini AI Rate Limit (429):** Free tier request quota reached. Please wait about 1 minute and try again.");
            } else {
                appendChatMessage("bot", "Connection issue! Unable to reach Flex Gym AI server right now. Please verify backend is running on port 8080.");
            }
        }
    );
}

function appendChatMessage(sender, text) {
    const chatContainer = $("#chat-messages");
    if (!chatContainer.length) return;

    let messageHtml = "";

    if (sender === "user") {
        messageHtml = `
            <div class="flexbot-msg flexbot-msg-user">
                <div class="flexbot-msg-content">
                    <p>${escapeHtml(text)}</p>
                </div>
            </div>
        `;
    } else {
        messageHtml = `
            <div class="flexbot-msg flexbot-msg-bot">
                <div class="flexbot-msg-avatar">🤖</div>
                <div class="flexbot-msg-content">
                    <p>${formatBotResponse(text)}</p>
                </div>
            </div>
        `;
    }

    chatContainer.append(messageHtml);
    scrollChatToBottom();
}

function appendTypingIndicator() {
    const chatContainer = $("#chat-messages");
    const id = "flexbot-typing-" + Date.now();
    const typingHtml = `
        <div id="${id}" class="flexbot-typing">
            <div class="flexbot-typing-avatar">🤖</div>
            <div class="flexbot-typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="flexbot-typing-text">FlexBot is thinking...</span>
        </div>
    `;
    chatContainer.append(typingHtml);
    scrollChatToBottom();
    return id;
}

function removeTypingIndicator(id) {
    $(`#${id}`).remove();
}

function scrollChatToBottom() {
    const chatContainer = $("#chat-messages");
    if (chatContainer.length) {
        chatContainer.stop().animate({ scrollTop: chatContainer[0].scrollHeight }, 300);
    }
}

function formatBotResponse(text) {
    if (!text) return "";
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/(?:^|\n)\s*[\*\-]\s+/g, "<br>• ");
    safe = safe.replace(/\n/g, "<br>");
    return safe;
}

function escapeHtml(str) {
    if (!str) return "";
    return $("<div>").text(str).html();
}