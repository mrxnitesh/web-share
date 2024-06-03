document.addEventListener('DOMContentLoaded', function () {
    const peer = new Peer();

    document.getElementById('sendOption').addEventListener('click', () => {
        document.getElementById('options').style.display = 'none';
        document.getElementById('sendFileContainer').style.display = 'block';
    });

    document.getElementById('receiveOption').addEventListener('click', () => {
        document.getElementById('options').style.display = 'none';
        document.getElementById('receiveFileContainer').style.display = 'block';
    });

    peer.on('open', (peerId) => {
        console.log('My peer ID is: ' + peerId);
        document.getElementById('fileUrl').value = `${window.location.href}?file=${peerId}`;
    });

    peer.on('error', (error) => {
        console.error('PeerJS error:', error);
    });

    document.getElementById('sendButton').addEventListener('click', () => {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file to send.');
            return;
        }

        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (event) => {
            const arrayBuffer = event.target.result;
            const chunkSize = 16 * 1024; // 16 KB
            const chunks = [];
            for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
                chunks.push(arrayBuffer.slice(i, i + chunkSize));
            }

            const fileUrl = `${window.location.href}?file=${peer.id}`;
            document.getElementById('fileUrl').value = fileUrl;
            document.getElementById('fileLink').style.display = 'block';

            peer.on('connection', (conn) => {
                conn.on('open', () => {
                    conn.send({
                        fileName: file.name,
                        fileSize: file.size,
                        totalChunks: chunks.length
                    });

                    chunks.forEach((chunk, index) => {
                        conn.send({ index, chunk });
                    });
                });
            });
        };
    });

    document.getElementById('receiveButton').addEventListener('click', () => {
        const fileLinkInput = document.getElementById('fileLinkInput').value;

        // Check if the pasted link is valid
        const urlParams = new URLSearchParams(fileLinkInput.split('?')[1]);
        const senderPeerId = urlParams.get('file');
        if (!senderPeerId) {
            // Show error message if the link is not valid
            alert('Invalid file link. Please paste a valid link.');
            return;
        }

        // If the link is valid, proceed with file receiving
        const conn = peer.connect(senderPeerId);

        let receivedChunks = [];
        let totalChunks = 0;
        let fileName = '';

        // Display a status message indicating file receiving process has started
        const statusMessage = document.createElement('p');
        statusMessage.textContent = 'Receiving file...';
        document.getElementById('receiveFileContainer').appendChild(statusMessage);

        // Progress indicator
        const progressBar = document.getElementById('progressBar');
        const progressContainer = document.getElementById('progressContainer');
        progressContainer.style.display = 'block';

        conn.on('open', () => {
            console.log('Connected to sender:', senderPeerId);
        });

        conn.on('data', (data) => {
            if (data.fileName) {
                fileName = data.fileName;
                totalChunks = data.totalChunks;
            } else {
                receivedChunks[data.index] = data.chunk;

                // Calculate progress
                const progress = Math.round((receivedChunks.filter(Boolean).length / totalChunks) * 100);
                progressBar.style.width = progress + '%';

                // Check if all chunks have been received
                if (receivedChunks.filter(Boolean).length === totalChunks) {
                    // Hide the status message and progress bar when file receiving is complete
                    statusMessage.textContent = 'File received successfully!';
                    progressContainer.style.display = 'none';

                    // Create a blob from received chunks
                    const blob = new Blob(receivedChunks, { type: 'application/octet-stream' });

                    // Create temporary anchor element for downloading the file
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    document.body.appendChild(a);

                    // Create URL for the blob and trigger download
                    const url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = fileName;
                    a.click();

                    // Clean up
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }
            }
        });

        conn.on('error', (error) => {
            console.error('Connection error:', error);
            // Display an error message if the connection encounters an error
            statusMessage.textContent = 'Error receiving file. Please try again.';
            progressContainer.style.display = 'none';
        });
    });

    // Copy file link to clipboard
    document.getElementById('copyLinkButton').addEventListener('click', () => {
        const fileUrlTextArea = document.getElementById('fileUrl');
        fileUrlTextArea.select();
        document.execCommand('copy');
        alert('Link copied to clipboard!');
    });

    // Share file link
    document.getElementById('shareLinkButton').addEventListener('click', () => {
        const fileUrl = document.getElementById('fileUrl').value;

        // Create a modal or dialog box for sharing
        const modal = document.createElement('div');
        modal.classList.add('modal');

        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');

        const closeButton = document.createElement('span');
        closeButton.classList.add('close');
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        const shareText = document.createElement('p');
        shareText.textContent = 'Share this link with the recipient:';

        const linkInput = document.createElement('input');
        linkInput.value = fileUrl;
        linkInput.setAttribute('readonly', true);

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Link';
        copyButton.addEventListener('click', () => {
            linkInput.select();
            document.execCommand('copy');
            alert('Link copied to clipboard!');
        });

        modalContent.appendChild(closeButton);
        modalContent.appendChild(shareText);
        modalContent.appendChild(linkInput);
        modalContent.appendChild(copyButton);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        modal.style.display = 'block';
    });
});
