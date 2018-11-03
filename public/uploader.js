(function() {
    function createImagePreview(img, base) {
        var contain = document.createElement('li');
        var imgNode = document.createElement('img');
        imgNode.src = img.path;
        contain.className = 'image_library';
        contain.append(imgNode);
        var text = document.createElement('p');
        text.innerText = JSON.stringify(img);
        contain.append(text);
        var remove = document.createElement('strong');
        remove.innerText = ' X ';
        remove.addEventListener('click', function() {
            axios.delete(`image/${img.public_id}`);
            base.removeChild(contain);
        });
        contain.append(remove);
        base.append(contain);
    }

    function handleFiles() {
        var formData = new FormData();
        formData.append('file', inputElement.files[0]);
        var urlAPI = 'image_upload';
        axios
            .post(urlAPI, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            .then(function(response) {
                createImagePreview(response.data, document.getElementById('image_list'));
            });
    }

    var inputElement = document.getElementById('uploader');
    inputElement.addEventListener('change', handleFiles, false);

    axios.get('image_files').then(function(images) {
        var base = document.getElementById('image_list');
        images.data.forEach(function(img) {
            createImagePreview(img, base);
        });
    });

    var getValueForName = function getValueForName(name) {
        return document.getElementById(name).value;
    };

    document.getElementById('submit').addEventListener('click', function() {
        var title = getValueForName('title');
        var description = getValueForName('description');
        var price = getValueForName('price');
        var location = getValueForName('location');
        var image_url = getValueForName('image_url');
        var formData = new FormData();
        formData.set('title', title);
        formData.set('description', description);
        formData.set('price', price);
        formData.set('location', location);
        formData.set('photo_urls', JSON.stringify([image_url]));
        axios({
            method: 'post',
            url: 'items',
            data: formData,
            config: { headers: { 'Content-Type': 'multipart/form-data' } }
        }).then(function(response) {
           Array.prototype.forEach.call(document.getElementsByTagName('input'), function(input){
                input.value = "";
           });
           alert("Great success!")
        });
    });
})();

// baby aloha party shirt
// This shirt is in like new condition and has only been worn once. It was purchased in Hawaii from a local vendor. It is machine wash safe and soft cotton material. Asking 35 o.b.o
