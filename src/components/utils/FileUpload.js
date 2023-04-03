import React, {useState} from 'react'
import '../../App.css'
import { green } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { maxHeight, maxWidth } from '@mui/system';
import { Button, Grid, CircularProgress, Box, Alert} from '@mui/material'

const MAX_COUNT = 10;
function getExtension(filename){
    return filename.split('.').pop();
}
const FileUpload = () => {
    const [success, setSuccess] = useState(false);
    const [limitExceeded, setLimitExceeded] = useState(false);
    const [invalidFiles, setInvalidFiles] = useState([]);
    const [hasInvalidFiles, setHasInvalidFiles] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [pictures, setPictures] = useState([]);
    const [hasFile, setHasFile] = useState(uploadedFiles.length > 0);
    const [fileLimit, setFileLimit] = useState(false);
    const [predictions, setPredictions] = useState([]);

    const handleUploadFiles = files => {
        const uploaded = [];
        let limitExceeded = false;
        files.some((file) => {
            if (uploaded.findIndex((f)=>f.name === file.name) === -1){
                uploaded.push(file);
                if(uploaded.length === MAX_COUNT) setFileLimit(true);
                if(uploaded.length > MAX_COUNT){
                    alert(`You can only add a maximum of ${MAX_COUNT} files`);
                    setFileLimit(false);
                    limitExceeded = true;
                    return true;
                }
            }
        })
        if (!limitExceeded && !hasInvalidFiles){ 
            setUploadedFiles(uploaded)
            console.log(uploadedFiles)
            setHasFile(true)
        }
    }

    const uploadFiles = () => {
        const data = new FormData();
        setLoading(true);
        for(const file of uploadedFiles){
            data.append('files[]', file, file.name);
        }
        fetch('https://soy-api2.herokuapp.com/upload',{
            method: 'POST',
            body: data,
            redirect: 'follow'
        }).catch(error => console.log('error', error));
        fetch('http://localhost:5000/predict',{
            method: 'POST',
            body: data,
            redirect: 'follow'
        }).then(response=>response.json())
        .then(response=>{setPredictions(response)})
        .then(response=>{console.log(response);
                         setLoading(false)})
        .then(response=>{setSuccess(true)})
        .catch(error => console.log('error', error));
        setTimeout(() => setSuccess(false), 10000);
    }

    const handleFileEvent = (e) =>{
        setLimitExceeded(false);
        setHasInvalidFiles(false);
        setPredictions([]);
        setHasFile(false);
        setPictures([]);

        const chosenFiles = Array.prototype.slice.call(e.target.files);
        const pictureArray = [];
        const predictionArray = [];

        let hasInvalid = false;
        let invalid = [];

        if(chosenFiles.length > MAX_COUNT){
            setLimitExceeded(true);
            return;
        }
        for(let i = 0; i < chosenFiles.length; i++){
                if((getExtension(chosenFiles[i].name) === "png") || (getExtension(chosenFiles[i].name) === "jpg")){
                    pictureArray.push({"name":chosenFiles[i].name,"img":URL.createObjectURL(chosenFiles[i])})
                    predictionArray.push({"id": i,"prediction" : "", "accuracy" : "", "filename" : chosenFiles[i].name})
                }
                else{
                    invalid.push(chosenFiles[i].name);
                    hasInvalid = true;
                    setHasInvalidFiles(true);
                }
            }
        
        if(!hasInvalid){
                setPredictions(predictionArray);
                setPictures(pictureArray);
                handleUploadFiles(chosenFiles);
                return;
        }
        setInvalidFiles(invalid);
    }

    const Item = styled(Paper)(({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
        ...theme.typography.body2,
        padding: theme.spacing(1),
        textAlign: 'center',
        color: theme.palette.text.secondary,
      }));

    const picturesWithPrediction = pictures.map(picture =>{
        return {
            ...picture,
            "prediction": predictions.find(prediction => prediction.filename === picture.name)
        }
    })

    const cards = picturesWithPrediction.map(data =>
        <Grid item>
            <Item style = {{ width: 200,  height: 220}}>
                <div style = {{ width: 200,  height: 150}}>
                    <img src = {data.img} style = {{ maxHeight: 150,  maxWidth: 150}}></img>
                </div>
                    <div>
                        <strong>Image Name: </strong>{data.name}
                    </div>
                    <div>
                        <strong>Day Range: </strong> {data.prediction.prediction}<br/>
                        <strong>Confidence: </strong> {Math.round(data.prediction.accuracy*1000,3)/10}%
                    </div>
                
            </Item>
        </Grid>
    )

    return(
        <div>
            <Grid sx={{ m: 1, position: 'relative' }} className='uploaded-files-list' container spacing={2}>
                {cards}
            </Grid>
            <Box sx={{ m: 1, position: 'relative' }}>
                <Button variant = "contained" component = "label" disabled = {fileLimit}>
                    Select Files
                    <input id='fileUpload' type='file' multiple
                    hidden
                    onChange={handleFileEvent}
                    disabled={fileLimit}
                />
                </Button>
                <Button variant = "contained" color = "success" disabled = {!hasFile || loading || hasInvalidFiles || limitExceeded} onClick = {uploadFiles}>
                    Predict
                </Button>
                {loading && (<CircularProgress
                    size = {24}
                    sx={{
                        color: green[500],
                        position: 'absolute',
                        top: '50%',
                        marginTop: '-12px',
                        marginLeft: '-60px',
                      }}
                />)}
                {invalidFiles.map(eq => (<Alert key = {eq} severity = "error" hidden = {!hasInvalidFiles}>Invalid File Type for {eq}: Must use .jpg or .png filetype</Alert>))}
                <Alert severity = "error" hidden = {!limitExceeded} >You cannot upload more than {MAX_COUNT} files!</Alert>
                <Alert severity = "success" hidden = {!success}>Successfully uploaded!</Alert>
            </Box>
        </div>
    );
}

export default FileUpload;