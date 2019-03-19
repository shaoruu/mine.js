/**
 * LOGIN PAGE
 * - REPRESENTS: LAUNCHER LOGIN
 */

import React, { Component } from 'react'
import { Mutation, withApollo } from 'react-apollo'
import { withRouter, Redirect } from 'react-router-dom'
import { Formik } from 'formik'

import { LOGIN_MUTATION, LOGIN_SCHEMA } from '../../lib/graphql'
import { setCookie } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'

// TODO Componentize login form

class Login extends Component {
	render() {
		const { client, history, isAuth } = this.props

		if (isAuth) return <Redirect to="/home" />

		return (
			<Mutation
				mutation={LOGIN_MUTATION}
				onCompleted={data => {
					setCookie(data.login.token)

					// Force a reload of all current queries now that user is
					// logged in
					client.cache.reset().then(() => {
						history.push('/home')
					})
				}}
				onError={error => console.error(error)}>
				{(login, { error }) => (
					<Formik
						initialValues={{ email: '', password: '' }}
						validationSchema={LOGIN_SCHEMA}
						onSubmit={(values, { setSubmitting }) => {
							login({
								variables: {
									email: values.email.toLowerCase(),
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
							<form onSubmit={handleSubmit}>
								<h1>Login to Minecraft</h1>
								<input
									id="email"
									name="email"
									value={values.email}
									label="email"
									onChange={handleChange}
									onBlur={handleBlur}
									placeholder="Email"
								/>
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
								<button
									type="submit"
									disabled={
										!values.email ||
										!values.password ||
										isSubmitting ||
										!!(errors.email && touched.email) ||
										!!(errors.password && touched.password)
									}>
									Login
								</button>
								<button onClick={() => history.push('/register')}>
									Register
								</button>
							</form>
						)}
					/>
				)}
			</Mutation>
		)
	}
}

export default withAuthGuard(withRouter(withApollo(Login)))
