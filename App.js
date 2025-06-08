// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  chat_id: yup.string().required('Обязательное поле'),
  company_name: yup.string().required('Обязательное поле'),
  email: yup.string().email('Неверный формат') .required('Обязательное поле'),
  first_name: yup.string().required('Обязательное поле'),
  last_name: yup.string().required('Обязательное поле'),
  phone: yup.string().required('Обязательное поле'),
  username: yup.string().required('Обязательное поле'),
}).required();

function App() {
  const [serverErrors, setServerErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async data => {
    setServerErrors({});
    try {
      const resp = await axios.post(
        'https://platform.astanahubcloud.com/telegram/auth/registration',
        data
      );
      if (resp.data.status) {
        setSuccess(true);
      } else {
        for (let key in resp.data.errors) {
          setError(key, { type: "server", message: resp.data.errors[key] });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (success) return <h2>Вы успешно зарегистрировались, ожидайте проверку.</h2>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {['chat_id','company_name','email','first_name','last_name','phone','username'].map(field => (
        <div key={field}>
          <label>{{
            chat_id: 'Chat ID',
            company_name: 'Компания',
            email: 'Email',
            first_name: 'Имя',
            last_name: 'Фамилия',
            phone: 'Телефон',
            username: 'Имя пользователя'
          }[field]}</label>
          <input {...register(field)} style={{border: errors[field] ? '1px solid red' : undefined}} />
          <p style={{color: 'red'}}>{errors[field]?.message}</p>
        </div>
      ))}
      <button type="submit">Регистрация</button>
    </form>
  );
}

export default App;

