document.getElementById('sendOption').addEventListener('click', () => {
    document.getElementById('options').style.display = 'none';
    document.getElementById('sendFileContainer').style.display = 'block';
});

document.getElementById('receiveOption').addEventListener('click', () => {
    document.getElementById('options').style.display = 'none';
    document.getElementById('receiveFileContainer').style.display = 'block';
});

const peer = new Peer();

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

        const conn = peer.connect(fileUrl.split('?file=')[1]);
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
    };
});

document.getElementById('receiveButton').addEventListener('click', () => {
    const fileLinkInput = document.getElementById('fileLinkInput').value;
    const urlParams = new URLSearchParams(fileLinkInput.split('?')[1]);
    const senderPeerId = urlParams.get('file');

    const conn = peer.connect(senderPeerId);

    let receivedChunks = [];
    let totalChunks = 0;
    let fileName = '';

    conn.on('open', () => {
        console.log('Connected to sender:', senderPeerId);
    });

    conn.on('data', (data) => {
        if (data.fileName) {
            fileName = data.fileName;
            totalChunks = data.totalChunks;
        } else {
            receivedChunks[data.index] = data.chunk;

            if (receivedChunks.length === totalChunks) {
                const blob = new Blob(receivedChunks, { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
            }
        }
    });

    conn.on('error', (error) => {
        console.error('Connection error:', error);
    });
});

peer.on('connection', (conn) => {
    conn.on('data', (data) => {
        if (data.fileName) {
            console.log('Receiving metadata:', data);
        } else {
            console.log('Receiving chunk', data.index);
        }
    });
});
