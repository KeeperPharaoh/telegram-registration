// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IMaskInput } from 'react-imask';
import { Controller } from 'react-hook-form';

const schema = yup.object({
  company_name: yup.string().required('Обязательное поле'),
  email: yup.string().email('Неверный формат') .required('Обязательное поле'),
  first_name: yup.string().required('Обязательное поле'),
  last_name: yup.string().required('Обязательное поле'),
  phone: yup
    .string()
    .required('Обязательное поле')
    .test('is-full', 'Введите корректный номер', value => {
      // value может быть undefined/null
      if (!value) return false;
      // Проверяем, что все символы кроме + и пробелов — цифры, и длина 16 ("+7 000 000 00 00")
      const digits = value.replace(/\D/g, '');
      // +7 000 000 00 00 => 11 цифр (7 + 10)
      return value.length === 16 && digits.length === 11;
    }),
  username: yup.string().required('Обязательное поле'),
}).required();

function App() {
  const [, setServerErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Получаем chat_id из query-параметра
  const searchParams = new URLSearchParams(window.location.search);
  const chatId = searchParams.get('chat_id') || '';

  const { register, handleSubmit, setError, formState: { errors }, reset, control } = useForm({
    resolver: yupResolver(schema)
  });

  // Убираем chat_id из массива полей формы
  const fields = ['company_name','email','first_name','last_name','phone','username'];

  const onSubmit = async data => {
    setServerErrors({});
    try {
      // Добавляем chat_id к данным
      const resp = await axios.post(
          'https://platform.astanahubcloud.com/telegram/auth/registration',
          { ...data, chat_id: chatId }
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

  if (success) return <h2 style={{color: 'white', textAlign: 'center', marginTop: '20vh'}}>Вы успешно зарегистрировались, ожидайте проверку.</h2>;

  return (
      <div style={{
        minHeight: '100vh',
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          style={{
            background: 'rgba(20,20,20,0.95)',
            padding: 40,
            borderRadius: 16,
            boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
            width: '100%',
            maxWidth: 480,
            color: 'white',
          }}
        >
          {fields.map(field => (
              <div key={field} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 24,
              }}>
                <label style={{
                  flex: 1,
                  marginRight: 16,
                  fontWeight: 500,
                  fontSize: 16,
                  color: '#aaa',
                  textAlign: 'right',
                }}>{{
                  company_name: 'Компания',
                  email: 'Email',
                  first_name: 'Имя',
                  last_name: 'Фамилия',
                  phone: 'Телефон',
                  username: 'Логин'
                }[field]}</label>
                <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                  {field === 'phone' ? (
                    <Controller
                      name="phone"
                      control={control}
                      defaultValue=""
                      render={({ field: { onChange, onBlur, value, ref } }) => (
                        <IMaskInput
                          mask="+7 000 000 00 00"
                          unmask={false}
                          value={value}
                          inputRef={ref}
                          onAccept={onChange}
                          onBlur={onBlur}
                          style={{
                            border: errors[field] ? '1px solid #2ecc40' : '1px solid #333',
                            background: '#222',
                            color: 'white',
                            borderRadius: 6,
                            padding: '10px 12px',
                            fontSize: 16,
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}
                    />
                  ) : (
                    <input 
                      {...register(field)} 
                      style={{
                        border: errors[field] ? '1px solid #2ecc40' : '1px solid #333',
                        background: '#222',
                        color: 'white',
                        borderRadius: 6,
                        padding: '10px 12px',
                        fontSize: 16,
                        outline: 'none',
                        width: '100%',
                        boxSizing: 'border-box',
                      }} 
                    />
                  )}
                  <p style={{color: '#2ecc40', margin: 0, fontSize: 13}}>{errors[field]?.message}</p>
                </div>
              </div>
          ))}
          <button 
            type="submit" 
            style={{
              width: '100%',
              background: '#2ecc40',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '14px 0',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 12,
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#27ae60'}
            onMouseOut={e => e.currentTarget.style.background = '#2ecc40'}
          >
            Регистрация
          </button>
        </form>
      </div>
  );
}

export default App;
