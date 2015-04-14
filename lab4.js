//John Dobson - 4/14/15
var canvas;
var gl;

var numVertices  = 72;

var texSize = 64;

//create a checkerboard pattern using floats

var image1 = new Array();
	for (var i = 0; i<texSize; i++) image1[i] = new Array();
	for (var i = 0; i<texSize; i++)
		for (var j=0; j<texSize; j++)
			image1[i][j] = new Float32Array(4);
	for (var i = 0; i<texSize; i++) for (var j=0; j<texSize; j++) {
		var c = (((i & 0x8) == 0) ^ ((j & 0x8) ==0));
		image1[i][j] = [c,c,c,1];
	}
	
//convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);
	for (var i = 0; i<texSize; i++)
		for (var j=0; j<texSize; j++)
			for (var k=0; k<4 ; k++)
				image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];
			

var pointsArray = [];
var normalsArray = [];
var texCoordsArray = [];

var texture;

var texCoord = [
	vec2(0,0),
	vec2(0,1),
	vec2(1,1),
	vec2(1,0)
	];
	

var vertices = [
			vec4( 0.8, 0.8, 0.8, 1.0),
			vec4( 0.8,-0.8, 0.8, 1.0),
			vec4(-0.8,-0.8, 0.8, 1.0),
			vec4(-0.8, 0.8, 0.8, 1.0),
			vec4( 0.8,-0.8,-0.8, 1.0),
			vec4( 0.8, 0.8,-0.8, 1.0),
			vec4(-0.8, 0.8,-0.8, 1.0),
			vec4(-0.8,-0.8,-0.8, 1.0),
			vec4( 0.0, 0.0, 1.6, 1.0),
			vec4( 0.0, 1.6, 0.0, 1.0),
			vec4( 0.0,-1.6, 0.0, 1.0),
			vec4( 1.6, 0.0, 0.0, 1.0),
			vec4(-1.6, 0.0, 0.0, 1.0),
			vec4( 0.0, 0.0,-1.6, 1.0)
    ];

var lightPosition = vec4(1.0, 1.5, 5.0, 0.0 );
var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0 );
var lightDiffuse = vec4( 1.3, 1.3, 1.3, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 0.5, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 50.0;


const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];

var thetaLoc;

var flag = true;

function configureTexture( image ) {
	texture = gl.createTexture();
	gl.bindTexture( gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap( gl.TEXTURE_2D);
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function colorStar()
{
	tri(0,9,3);
	tri(3,12,2);
	tri(2,10,1); // 9
	tri(1,11,0);
	tri(0,3,8);
	tri(8,3,2);	// 18
	tri(2,1,8); 
	tri(8,1,0);
	tri(0,5,9); // 27
	tri(0,11,5);
	tri(11,1,4);
	tri(4,1,10);// 36
	tri(4,5,11);
	tri(13,5,4);
	tri(3,9,6); // 45
	tri(3,6,12);
	tri(12,7,2);
	tri(2,7,10);// 54
	tri(12,6,7);
	tri(6,13,7);
	tri(9,5,6); //63
	tri(6,5,13);
	tri(13,4,7);
	tri(7,4,10); //72
}

function tri(a,b,c)
{
	 var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);


     pointsArray.push(vertices[a]); 
     normalsArray.push(normal);
	 texCoordsArray.push(texCoord[0]);
     pointsArray.push(vertices[b]); 
     normalsArray.push(normal);
	 texCoordsArray.push(texCoord[1]);
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal); 
	 texCoordsArray.push(texCoord[2]);
   
}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
	
	document.onkeydown=handleKeyDown;

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    colorStar();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
	
	//handle texture
	
	var tBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
	
	var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
	gl.vertexAttribPointer (vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray( vTexCoord);
	
	
	var image = document.getElementById("texImage");
	
	configureTexture ( image2 );
		

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    viewerPos = vec3(0.0, 0.0, -5.0 );

    //projection = ortho(-1, 1, -1, 1, -100, 100);
	projection = perspective(45,1,0.1,50);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));
    
    render();
}

//Event listeners for WASD key inputs
function handleKeyDown(event){
		switch(event.keyCode){
			case 49: //'1' Key pressed
				theta = [0,0,0]; //reset object to original orientation
				break;
			case 37: //left arrow key
				theta[yAxis] += 2.0;
				break;
				
			case 38: //up arrow key
				theta[xAxis] -= 2.0;
				break;
			case 39: //right arrow key
				theta[yAxis] -= 2.0;
				break;
			case 40: //down arrow
				theta[xAxis] += 2.0; 
				break;
		}
	}; 

var render = function(){
            
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    //if(flag) theta[axis] += 2.0;
            
    modelView = mat4();
	modelView = mult(modelView, lookAt(viewerPos, at , up));
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    gl.drawArrays( gl.TRIANGLES, 0, 72 );
            
            
    requestAnimFrame(render);
}
