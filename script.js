let peer;

function startFileTransfer() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const statusDiv = document.getElementById('status');

    if (file) {
        statusDiv.textContent = 'Waiting for connection...';

        peer = new SimplePeer({ initiator: true, trickle: false });

        peer.on('signal', data => {
            statusDiv.textContent = 'Waiting for receiver to connect...';
            const connectionId = JSON.stringify(data);
            prompt('Share this connection ID with the receiver:', connectionId);
        });

        peer.on('connect', () => {
            statusDiv.textContent = 'Connection established. Sending file...';
            peer.send(file);
        });

        peer.on('error', err => {
            console.error('Error:', err);
            statusDiv.textContent = 'An error occurred during the file transfer';
        });
    } else {
        alert('Please select a file.');
    }
}

function connectToPeer() {
    const connectionInput = document.getElementById('connectionInput');
    const statusDiv = document.getElementById('status');
    const connectionId = connectionInput.value;

    if (connectionId) {
        statusDiv.textContent = 'Connecting...';

        peer = new SimplePeer({ trickle: false });

        peer.on('signal', data => {
            console.log('Signal:', data);
        });

        peer.on('connect', () => {
            statusDiv.textContent = 'Connection established. Waiting for file...';
        });

        peer.on('data', data => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([data]));
            a.download = 'received_file';
            a.textContent = 'Download file';
            document.getElementById('downloadLink').appendChild(a);
            statusDiv.textContent = 'File received successfully!';
        });

        peer.on('error', err => {
            console.error('Error:', err);
            statusDiv.textContent = 'An error occurred during the file transfer';
        });

        try {
            peer.signal(JSON.parse(connectionId));
        } catch (err) {
            console.error('Error parsing connection ID:', err);
            alert('Invalid connection ID format. Please check and try again.');
            statusDiv.textContent = 'Invalid connection ID';
        }
    } else {
        alert('Please enter a connection ID.');
    }
}
