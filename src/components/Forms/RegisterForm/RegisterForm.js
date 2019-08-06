import withAuthGuard from '../../../hoc/AuthGuard/AuthGuard'
import logo from '../../../assets/gui/MCJS_register.png'
import { REGISTER_MUTATION, REGISTER_SCHEMA } from '../../../lib/graphql'
import { Hint } from '../../Utils'
import { removeAllCookies, setCookie } from '../../../lib/utils'

import classes from './RegisterForm.module.css'

import React from 'react'
import { Formik } from 'formik'
import { Mutation, withApollo } from 'react-apollo'
import { withRouter } from 'react-router-dom'

const RegisterForm = ({ client, loading: authHint, history }) => {
  return (
    <Mutation
      mutation={REGISTER_MUTATION}
      onCompleted={data => {
        removeAllCookies()

        setCookie(data.createUser.token)

        // Force a reload of all current queries now that user is
        // logged in
        client.cache.reset().then(() => {
          history.push('/home')
        })
      }}
      // eslint-disable-next-line no-console
      onError={error => console.error(error)}
    >
      {(register, { error, loading }) =>
        loading || authHint ? (
          <Hint />
        ) : (
          <Formik
            initialValues={{ username: '', email: '', password: '' }}
            validationSchema={REGISTER_SCHEMA}
            onSubmit={(values, { setSubmitting }) => {
              register({
                variables: {
                  username: values.username.toLowerCase().trim(),
                  email: values.email.toLowerCase().trim(),
                  password: values.password
                }
              })
              setSubmitting(false)
            }}
            render={({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting
            }) => (
              <form onSubmit={handleSubmit} className={classes.wrapper}>
                <img src={logo} alt="MCJS" className={classes.logo} />

                <div className={classes.inputFields}>
                  <div className={classes.inputField}>
                    <h1>Username</h1>
                    <div className={classes.wrappedInputField}>
                      <input
                        id="username"
                        name="username"
                        value={values.username}
                        label="username"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Username"
                      />
                      <span>
                        {(touched.username && errors.username
                          ? errors.username
                          : '') ||
                          (error && error.message.includes('name = username')
                            ? 'Username taken.'
                            : '')}
                      </span>
                    </div>
                  </div>

                  <div className={classes.inputField}>
                    <h1>Email</h1>
                    <div className={classes.wrappedInputField}>
                      <input
                        id="email"
                        name="email"
                        value={values.email}
                        label="email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Email"
                      />
                      <span>
                        {(touched.email && errors.email ? errors.email : '') ||
                          (error && error.message.includes('name = email')
                            ? 'Email already registered.'
                            : '')}
                      </span>
                    </div>
                  </div>

                  <div className={classes.inputField}>
                    <h1>Password</h1>
                    <div className={classes.wrappedInputField}>
                      <input
                        id="password"
                        name="password"
                        value={values.password}
                        type="password"
                        autoComplete="current-password"
                        label="Password"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Password"
                      />
                      <span>
                        {touched.password && errors.password
                          ? errors.password
                          : ''}
                      </span>
                    </div>
                  </div>

                  <div className={classes.navigations}>
                    <button
                      type="button"
                      className={classes.login}
                      onClick={() => history.push('/login')}
                    >
                      Already have an account?
                    </button>
                    <button
                      type="submit"
                      className={classes.register}
                      disabled={
                        !values.email ||
                        !values.username ||
                        !values.password ||
                        isSubmitting ||
                        !!(errors.email && touched.email) ||
                        !!(errors.username && touched.username) ||
                        !!(errors.password && touched.password)
                      }
                    >
                      Register
                    </button>
                  </div>
                </div>
              </form>
            )}
          />
        )
      }
    </Mutation>
  )
}

export default withAuthGuard(withRouter(withApollo(RegisterForm)))
