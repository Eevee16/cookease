import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/Auth.css';


function Signup() {
    const navigate = useNavigate();
    const [formdata , setFormdata] = useState({
        displayName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        setFormdata ({
            ...formData, [e.target.name]: 
            e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        //validation
        if (formData.password !== formData.confirmPassword){
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6){
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        //TODO ADD FIREBASE SIGNUP
        console.log("Signup data: ", formData);
    }   

}