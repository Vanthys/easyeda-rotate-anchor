api('createToolbarButton', {
    icon: api('getRes', { file: 'icon.svg' }),
    title: 'Rotate Around',
    fordoctype: 'pcb',
    cmd: "extension-raround-dialog"
});

var center = {x:0, y:0};
var positions = {};
var rotations = {};
var dlgOptions = null;


api('createCommand', {
    'extension-raround-dialog': function () {
        positions = {};
        rotations = {};
        dlgOptions = null;
        let ids = api('getSelectedIds').split(',');
        if (!Array.isArray(ids)) {
            console.warn("[ERROR] (single mode)");
            return;
        }
        ids.forEach((id) => {
            let obj = api('getShape', { "id": id })
            //console.log(obj["head"])
            positions[id] = { "x": parseFloat(obj["head"]["x"]), "y": parseFloat(obj["head"]["y"])}
            rotations[id] = parseFloat(obj["head"]["rotation"])
        })
       // console.log("Current Selection", Object.keys(positions))
        center = calculateCenter(positions);
        let ct = api('coordConvert', {type:'canvas2real',x: center.x, y: center.y})

        console.log(ct);
        dlgOptions = api('createDialog', {
            title: "Rotate Around Options",
            content : '<div id="dlg-raround-setting-items" style="padding:10px;">' + 
                        '<p>Here you can change some options for the roate around extension</p>' + 
                        '<label for="drange">Degrees: </label>' +
                        '<form>' +
                        '<input type="range" id="drange" name="drange" value="0" min="-360" max="360" oninput="this.form.dnumber.value=this.value">'+
                        '<input type="number" name="dnumber" value="0" min="-360" max="360" oninput="this.form.drange.value=this.value" />' +
                        '<div><input type="checkbox" id="rotatei" name="rotatei"/><label for="rotatei">Also rotate individual footprints</label></div>'+
                        '<label for="cx">Rotation Anchor (default is center)</label>'+ 
                        '<div><input type="number" id="cx" name="cx" value="' + ct.x + '"/><input type="number" id="cy" name="cy" value="' + ct.y + '"/></div>'+
                        '</form>'+
                        '</div>',
            width : 280,
            height : 300,
            modal : true,
            buttons : [{
                    text : 'Apply',
                    cmd : 'extension-raround-rotate;dialog-close'
                }, {
                    text : 'Cancel',
                    cmd : 'dialog-close'
                }
            ]
        });
        
        dlgOptions.dialog("open");
    },
    'extension-raround-rotate': function () {
        let degrees = $("#drange").val();
        let rotatei = $("#rotatei").is(":checked");
        let cx = $("#cx").val();
        let cy = $("#cy").val();
        let ct = api('coordConvert', {type:'real2canvas',x: cx, y: cy})
        console.log("Rotate individual: ", rotatei )
        console.log("Would now roatate around: ", degrees)
        console.log("Center: ", cx, " - ", cy);


        /*
        let ids = api('getSelectedIds').split(',');
        if (!Array.isArray(ids)) {
            console.log("[ERROR] (single mode)");
            return;
        }
        let positions = {}
        ids.forEach((id) => {
            let obj = api('getShape', { "id": id })
            positions[id] = { "x": obj["head"]["x"], "y": obj["head"]["y"] }
        })

        const center = calculateCenter(positions);
        */
       
        for (let key in positions) {
            if (positions.hasOwnProperty(key)) {
                let point = positions[key];
                positions[key] = rotatePoint(point, center, degrees);
                api('moveObjsTo', { objs: [{ gId: key }], x: positions[key].x, y: positions[key].y });
                if(rotatei){
                    api('rotate', {ids:[key], degree: rotations[key] + degrees} )
                }
            }
        }
    

    }
});





function calculateCenter(data) {
    let totalX = 0;
    let totalY = 0;
    let count = 0;

    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            let point = data[key];
            totalX += point.x;
            totalY += point.y;
            count++;
        }
    }
    const x = totalX / count;
    const y = totalY / count;
    return { x, y };
}



function rotatePoint(point, center, angle) {
    var radians = angle * Math.PI / 180;
    var cos = Math.cos(radians);
    var sin = Math.sin(radians);
    var x = point.x - center.x;
    var y = point.y - center.y;
    var newX = x * cos - y * sin + center.x;
    var newY = x * sin + y * cos + center.y;
    return { x: newX, y: newY };
}



