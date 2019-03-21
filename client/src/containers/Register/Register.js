/**
 * REGISTER PAGE
 * - REPRESENTS: MINECRAFT.ORG / MOJANG REGISTRATION
 */

import React, { Component } from 'react'
import { Mutation, withApollo } from 'react-apollo'
import { withRouter, Redirect } from 'react-router-dom'
import { Formik } from 'formik'

import { REGISTER_MUTATION } from '../../lib/graphql'
import { setCookie, removeAllCookies } from '../../lib/utils'
import withAuthGuard from '../../hoc/AuthGuard/AuthGuard'
import { Hint } from '../../components/Utils'

class Register extends Component {
	render() {
		const { client, history, isAuth, loading: authHint } = this.props

		if (isAuth) return <Redirect to="/home" />

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
				onError={error => console.error(error)}>
				{(register, { error, loading }) =>
					loading || authHint ? (
						<Hint />
					) : (
						<Formik
							initialValues={{ username: '', email: '', password: '' }}
							validationSchema={REGISTER_MUTATION}
							onSubmit={(values, { setSubmitting }) => {
								register({
									variables: {
										username: values.username.toLowerCase(),
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
									<h1>Regsiter an account for Minecraft</h1>
									<input
										id="username"
										name="username"
										value={values.username}
										label="username"
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder="Username"
									/>
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
											!values.username ||
											!values.password ||
											isSubmitting ||
											!!(errors.email && touched.email) ||
											!!(errors.username && touched.username) ||
											!!(errors.password && touched.password)
										}>
										Register
									</button>
									<button onClick={() => history.push('/login')}>
										Login
									</button>
								</form>
							)}
						/>
					)
				}
			</Mutation>
		)
	}
}

export default withAuthGuard(withRouter(withApollo(Register)))
