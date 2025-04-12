document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('', '', ''));

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email(recipients, subject, body) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-email-view').style.display = 'none';

  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;

  document.querySelector('#compose-form').onsubmit = () => {
    fetch(`/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value,
      })
    })
      .then(response => response.json())
      .then(result => {
        // Print result
        console.log(result);
        load_mailbox('inbox');
      });
    return false
  }
}


function archiveEmail(id, icon) {
  const button = icon.parentElement;
  const emailItem = button.closest(".email-item");
  button.disabled = true;
  const isArchived = button.dataset.archived === "true";
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !isArchived
    })
  })
    .then(response => {
      if (response.status === 204) {
        return { archived: !isArchived };
      } else {
        throw new Error("Resposta inesperada do servidor.");
      }
    })
    .then(updatedEmail => {
      icon.classList.remove("bi-archive", "bi-archive-fill");
      icon.classList.add(updatedEmail.archived ? "bi-archive-fill" : "bi-archive");
      emailItem.style.animationPlayState = 'running';
      emailItem.addEventListener('animationend', () => {
        emailItem.remove();
      });
    })
    .catch(error => {
      console.error("Erro ao arquivar email:", error);
      alert("Não foi possível arquivar o email.");
    })
    .finally(() => {
      button.disabled = false;
    });
}


function view_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#read-email-view').style.display = 'block';

      document.querySelector('#read-email-view').innerHTML = `
        <div style="position: relative;">
          <button style="position: absolute; top: 0; right: 0; margin: 10px; border: 1rem;" id="reply-button"><i id="reply-icon" class="bi bi-reply"></i></button>
          <h3>${email.subject}</h3>
          <strong>From: </strong>${email.sender}<br>
          <strong>To: </strong>${email.recipients.join(", ")}<br>
          <strong>Date: </strong>${email.timestamp}
          <hr>
          <p>${email.body.replace(/\n/g, "<br>")}</p>
        </div>`;

      const replyButton = document.querySelector('#reply-button');
      const replyicon = document.querySelector('#reply-icon');

      function activateReplyIcon() {
        replyicon.classList.remove('bi-reply');
        replyicon.classList.add('bi-reply-fill');
      }

      function deactivateReplyIcon(send) {
        replyicon.classList.remove('bi-reply-fill');
        replyicon.classList.add('bi-reply');

        if (send) {
          let eSubject = email.subject;
          let eBody = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
          if (!eSubject.startsWith("RE: ")) {
            eSubject = `RE: ${email.subject}`;
          };

          compose_email(email.sender, eSubject, eBody);
        };
      }

      replyButton.addEventListener('mousedown', activateReplyIcon);
      replyButton.addEventListener('mouseup', () => deactivateReplyIcon(true));
      document.addEventListener('mouseup', () => {
        if (replyicon.classList.contains('bi-reply-fill')) deactivateReplyIcon(false);
      });

      fetch(`/emails/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          read: true,
        })
      })
        .then(() => console.log("Email marcado como lido"));
    })
}


function load_mailbox(mailbox) {
  // Mostra a caixa de emails e esconde a de composição
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-email-view').style.display = 'none';

  // Define o título da caixa
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const participantLabel = mailbox === "inbox" ? "From" : "To";
        const emailElement = document.createElement("div");
        emailElement.classList.add("email-item");
        if (email.read) emailElement.classList.add("email-read");

        const emailContent = document.createElement("div");
        emailContent.innerHTML = `
          <strong>${participantLabel}: </strong>${mailbox === "inbox" ? email.sender : email.recipients.join(", ")}<br/>
          <strong>Subject: </strong>${email.subject}<br>
          <strong>Date: </strong>${email.timestamp}<br>
        `;
        emailContent.classList.add("email-item-content");

        emailElement.appendChild(emailContent);

        if (mailbox !== "sent") {
          const spacer = document.createElement("div");
          spacer.style.width = "20px";
          spacer.style.height = "100%";
          spacer.style.cursor = "default";

          const archiveButton = document.createElement("button");
          archiveButton.dataset.archived = email.archived
          archiveButton.classList.add("archive-btn");
          const archiveIcon = document.createElement("i");
          if (email.archived) {
            archiveIcon.classList.add("bi", "bi-archive-fill");
          } else {
            archiveIcon.classList.add("bi", "bi-archive");
          }

          archiveButton.appendChild(archiveIcon);

          archiveButton.addEventListener('click', () => {
            archiveEmail(email.id, archiveIcon)
          })

          emailElement.appendChild(spacer);
          emailElement.appendChild(archiveButton);
        }

        emailContent.addEventListener('click', () => {
          view_email(email.id);
        });

        document.querySelector('#emails-view').append(emailElement);
      })
    })
    .catch(error => console.error("Erro ao carregar emails:", error));
}
