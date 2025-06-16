// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IMaskInput } from 'react-imask';
import { Controller } from 'react-hook-form';

const emailSchema = yup.object({
  email: yup.string().email('Неверный формат').required('Обязательное поле'),
}).required();

const codeSchema = yup.object({
  code: yup.string().required('Обязательное поле'),
}).required();

const registrationSchema = yup.object({
  company_name: yup.string().required('Обязательное поле'),
  first_name: yup.string().required('Обязательное поле'),
  last_name: yup.string().required('Обязательное поле'),
  username: yup.string().required('Обязательное поле'),
}).required();

function App() {
  const [step, setStep] = useState('email_input'); // 'email_input', 'code_input', 'registration_form', 'success'
  const [email, setEmail] = useState('');
  const [requestId, setRequestId] = useState('');
  const [serverErrors, setServerErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const chatId = searchParams.get('chat_id') || '';
  const phone = searchParams.get('phone') || '';

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const resp = await axios.post(
          'https://platform.astanahubcloud.com/telegram/auth/check',
          { chat_id: chatId, phone: phone }
        );
        if (resp.data.state !== 'new') {
          setIsAlreadyRegistered(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkRegistration();
  }, [chatId, phone]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    reset,
    control,
  } = useForm({
    resolver: yupResolver(step === 'email_input' ? emailSchema : (step === 'code_input' ? codeSchema : registrationSchema))
  });

  const onSubmit = async data => {
    setServerErrors({});
    setIsSubmitting(true);
    try {
      if (step === 'email_input') {
        setEmail(data.email);
        const resp = await axios.post(
          'https://platform.astanahubcloud.com/telegram/auth/code/send',
          { email: data.email }
        );
        if (resp.data.status) {
          setRequestId(resp.data.data.request_id);
          setStep('code_input');
        } else {
          for (let key in resp.data.errors) {
            setError(key, { type: "server", message: resp.data.errors[key] });
          }
        }
      } else if (step === 'code_input') {
        const resp = await axios.post(
          'https://platform.astanahubcloud.com/telegram/auth/code/check',
          { request_id: requestId, code: data.code }
        );
        if (resp.data.status) {
          setStep('registration_form');
        } else {
          for (let key in resp.data.errors) {
            setError(key, { type: "server", message: resp.data.errors[key] });
          }
        }
      } else if (step === 'registration_form') {
        const resp = await axios.post(
          'https://platform.astanahubcloud.com/telegram/auth/registration',
          { ...data, email: email, chat_id: chatId, phone }
        );
        if (resp.data.status) {
          setRegistrationSuccess(true);
          if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.close();
          }
        } else {
          for (let key in resp.data.errors) {
            setError(key, { type: "server", message: resp.data.errors[key] });
          }
        }
      }
    } catch (e) {
      // Обработка ошибок с сервера (422)
      if (e.response && e.response.data && e.response.data.errors) {
        for (let key in e.response.data.errors) {
          setError(key, { type: "server", message: e.response.data.errors[key] });
        }
      } else {
        console.error(e);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAlreadyRegistered) {
    return <h2 style={{color: 'black', textAlign: 'center', marginTop: '20vh', fontSize: '24px'}}>Вы уже зарегистрировались</h2>;
  }

  if (!phone) {
    return <h2 style={{color: 'black', textAlign: 'center', marginTop: '20vh', fontSize: '24px'}}>Невалидная ссылка</h2>;
  }

  if (registrationSuccess) return <h2 style={{color: 'black', textAlign: 'center', marginTop: '20vh', fontSize: '24px'}}>Вы успешно зарегистрировались, ожидайте проверку.</h2>;

  const renderForm = () => {
    let currentFields = [];
    let title = '';
    let submitButtonText = '';

    if (step === 'email_input') {
      currentFields = ['email'];
      title = 'Введите email';
      submitButtonText = 'Отправить код';
    } else if (step === 'code_input') {
      currentFields = ['code'];
      title = 'Введите код из почты';
      submitButtonText = 'Проверить код';
    } else if (step === 'registration_form') {
      currentFields = ['company_name', 'first_name', 'last_name', 'username'];
      title = 'Регистрация';
      submitButtonText = 'Зарегистрироваться';
    }

    return (
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        style={{
          background: '#fff',
          padding: '32px 20px',
          borderRadius: 16,
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          width: 'auto',
          maxWidth: '90vw',
          color: '#222',
          margin: '0 auto',
        }}
      >
        {step === 'code_input' && (
          <button 
            type="button" 
            onClick={() => setStep('email_input')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              padding: '0px',
              cursor: 'pointer',
              marginBottom: 16,
              color: '#333',
            }}
          >
            ←
          </button>
        )}
        <h2>{title}</h2>
        {currentFields.map(field => (
          <div key={field} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            marginBottom: 24,
          }}>
            <label style={{
              marginBottom: 8,
              fontWeight: 500,
              fontSize: 16,
              color: '#333',
              textAlign: 'left',
            }}>{{
              email: 'Email',
              code: 'Код',
              company_name: 'Компания',
              first_name: 'Имя',
              last_name: 'Фамилия',
              username: 'Логин'
            }[field]}</label>
            <input 
              {...register(field)} 
              type={field === 'code' ? 'number' : 'text'}
              style={{
                border: errors[field] ? '1px solid #e74c3c' : '1px solid #ccc',
                background: '#fafafa',
                color: '#222',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 16,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }} 
            />
            <p style={{color: '#e74c3c', margin: 0, fontSize: 13, minHeight: 18}}>{errors[field]?.message}</p>
          </div>
        ))}
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{
            width: '100%',
            background: isSubmitting ? '#ccc' : '#2ecc40',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '14px 0',
            fontSize: 18,
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginTop: 12,
            transition: 'background 0.2s',
          }}
          onMouseOver={e => !isSubmitting && (e.currentTarget.style.background = '#27ae60')}
          onMouseOut={e => !isSubmitting && (e.currentTarget.style.background = '#2ecc40')}
        >
          {submitButtonText}
        </button>
      </form>
    );
  };

  return (
      <div style={{
        background: '#fff',
      }}>
        {renderForm()}
      </div>
  );
}

export default App;
