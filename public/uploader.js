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
        var remove = document.createElement('strong')
        remove.innerText = " X ";
        remove.addEventListener('click', function(){
            axios.delete(`image/${img._id}`)
            base.removeChild(contain)
        })
        contain.append(remove)
        base.append(contain);
    }

    function handleFiles() {
        var formData = new FormData();
        formData.append('file', inputElement.files[0]);
        var urlAPI = 'image_upload';
        axios.post(urlAPI, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(function(response){
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
})();
