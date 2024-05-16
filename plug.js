document.getElementById('plug').addEventListener('click', function() {
    const plugWire = document.getElementById('plugWire');
    plugWire.style.transition = 'width 0.5s ease';
    plugWire.style.width = '0px';
    setTimeout(function() {
        plugWire.style.display = 'none';
        document.getElementById('socket').style.backgroundColor = '#007BFF';
        document.getElementById('connectButton').innerText = 'Connected!';
    }, 500);
});
