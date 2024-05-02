import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AlternateLayout from "./AlternateLayout";
import Layout from "./Layout";
const EmployeeLogin = () => {

    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();
    async function handleLogin(e) {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:8000/employee-login", {
                employeeId, password
            });
            if (response.data.message === "NOTMATCH") {
                window.alert("Invalid ID or invalid password")
            }

            if (response.data.message === "SUCCESS") {
                window.alert("Login Successful")
                navigate('/loan-applications')
            }
            setPassword("");
        } catch (e) {
            console.log("Error in login", e)
        }


    }


    return (
        <>

            <style>
                {`
                    body, html {
                        height: 100%;
                        margin: 0;
                        background: linear-gradient(to bottom, #4287f5, #ffffff);
                    }
                `}
            </style>
            <AlternateLayout/>
            <div className="flex mt-16 flex-col h-full w-full sm:h-screen md:h-screen mb-0 items-center justify-center px-6 py-8 mx-auto lg:py-2 " style={{ overflowX: 'hidden' }}>
                <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-2 py-6 space-y-2 md:space-y-6 sm:p-8">
                        <h1 className="text-lg font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                            Employee Login
                        </h1>
                        <form className="space-y-4 md:space-y-2" method="post" onSubmit={handleLogin} >

                            <div>
                                <label for="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employee ID</label>
                                <input
                                    value={employeeId}
                                    onChange={(e) => { setEmployeeId(e.target.value) }}
                                    type="text" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500" placeholder="Employee ID" required="true" />
                            </div>
                            <div>
                                <label for="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} // Wrap setPassword in an arrow function
                                    type="password" name="password" id="password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500" required="true" />
                            </div>

                            <button type="submit" className="ml-36 text-white bg-green-700 hover:bg-green-800 focus:ring-4 font-medium rounded-lg text-sm px-5 py-2 text-center ">Submit</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EmployeeLogin;