'use client'

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client'; // Add this import

const UserInfoForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [cityState, setCityState] = useState('');
  const [country, setCountry] = useState('');
  const [sex, setSex] = useState('');
  const [result, setResult] = useState('');

  const { user, error, isLoading } = useUser(); // Add this line

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setResult('Please log in to save your information.');
      return;
    }

    const userData = {
      auth0Id: user.sub,
      firstName,
      lastName,
      weight,
      height,
      age,
      cityState,
      country,
      sex
    };

    try {
      const response = await fetch('/api/saveUserInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setResult('User information saved successfully!');
        window.location.href = '/dashboard';
      } else {
        setResult('Failed to save user information. Please try again.');
      }
    } catch (error) {
      console.error('Error saving user info:', error);
      setResult('An error occurred while saving user information.');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <h1>Patient Information</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />

          <label htmlFor="weight">Weight (kg):</label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />

          <label htmlFor="height">Height (cm):</label>
          <input
            type="number"
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            required
          />

          <label htmlFor="age">Age:</label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />

          <label htmlFor="cityState">City/State:</label>
          <input
            type="text"
            id="cityState"
            value={cityState}
            onChange={(e) => setCityState(e.target.value)}
            required
          />

          <label htmlFor="country">Country:</label>
          <input
            type="text"
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />

          <fieldset>
            <legend>Sex:</legend>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="male"
                  checked={sex === 'male'}
                  onChange={(e) => setSex(e.target.value)}
                  required
                />
                Male
              </label>
              <label>
                <input
                  type="radio"
                  value="female"
                  checked={sex === 'female'}
                  onChange={(e) => setSex(e.target.value)}
                  required
                />
                Female
              </label>
            </div>
          </fieldset>

          <button type="submit">Submit</button>
        </form>
        <div id="result">{result}</div>
      </div>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(to bottom, #4e54c8 0%, #ffffff 100%);
          padding: 2rem 0;
        }
        .container {
          font-family: Arial, sans-serif;
          font-size: 20px;
          background-color: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          max-width: 500px;
          width: 90%;
        }
        h1 {
          text-align: center;
          color: #333;
          font-size: 38px;
        }
        form {
          display: flex;
          flex-direction: column;
        }
        label {
          margin-top: 2rem;
        }
        input[type="text"],
        input[type="number"] {
          padding: 0.5rem;
          margin-top: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
        }
        fieldset {
          margin-top: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 0.5rem 0.5rem 0.25rem;
        }
        legend {
          padding: 0 0.5rem;
        }
        .radio-group {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 1.5rem;
        }
        .radio-group label {
          display: flex;
          align-items: center;
          margin: 1rem 2rem;
        }
        .radio-group input[type="radio"] {
          margin-right: 0.5rem;
        }
        button {
          margin-top: 2rem;
          padding: 0.5rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 20px;
        }
        button:hover {
          background-color: #0056b3;
        }
        #result {
          margin-top: 1rem;
          text-align: center;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default UserInfoForm;