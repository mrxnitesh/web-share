// Initialize PeerJS instance
const peer = new Peer();

// Event listener for PeerJS connection open
peer.on('open', (peerId) => {
    console.log('My peer ID is: ' + peerId);
});

// Event listener for PeerJS errors
peer.on('error', (error) => {
    console.error('PeerJS error:', error);
});

// Function to generate file download link
function generateFileLink(blob) {
    const url = URL.createObjectURL(blob);
    document.getElementById('fileUrl').value = url;
    document.getElementById('fileLink').style.display = 'block';
}

// Event listener for sending file
document.getElementById('sendButton').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to send.');
        return;
    }

    // Generate a random peer ID
    const peerId = Math.random().toString(36).substring(2);

    // Create a PeerJS instance with the generated peer ID
    const peer = new Peer(peerId);

    // Event listener for when PeerJS connection is open
    peer.on('open', () => {
        // Connect to recipient
        const conn = peer.connect('receiver');

        // Event listener for when data connection is open
        conn.on('open', () => {
            // Send file metadata
            conn.send({ fileName: file.name, fileSize: file.size });

            // Create a file reader
            const reader = new FileReader();

            // Event listener for when the file is read
            reader.onload = (event) => {
                // Send the file data
                conn.send(event.target.result);
            };

            // Read the file as a data URL
            reader.readAsDataURL(file);
        });

        // Event listener for when data is received
        conn.on('data', (data) => {
            // Handle received data (not implemented in this example)
        });
    });

    // Event listener for PeerJS errors
    peer.on('error', (error) => {
        console.error('PeerJS error:', error);
    });

    // Generate file download link
    generateFileLink(file);
});

// Event listener for receiving file
document.getElementById('receiveButton').addEventListener('click', () => {
    const senderPeerId = document.getElementById('senderPeerId').value;
    
    // Connect to sender
    const conn = peer.connect(senderPeerId);

    // Event listener for when data connection is open
    conn.on('open', () => {
        // Event listener for when data is received
        conn.on('data', (data) => {
            if (typeof data === 'object') {
                // Metadata received
                const fileSize = data.fileSize;
                const chunks = [];
                let receivedSize = 0;

                // Event listener for when file data is received
                conn.on('data', (chunk) => {
                    chunks.push(chunk);
                    receivedSize += chunk.length;
                    if (receivedSize === fileSize) {
                        // All chunks received, reconstruct file
                        const blob = new Blob(chunks);
                        generateFileLink(blob);
                    }
                });
            }
        });
    });

    // Event listener for PeerJS errors
    peer.on('error', (error) => {
        console.error('PeerJS error:', error);
    });
});
