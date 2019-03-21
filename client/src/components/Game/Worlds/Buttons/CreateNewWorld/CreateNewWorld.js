import React, { useState } from 'react'
import { Mutation } from 'react-apollo'
import { withRouter } from 'react-router-dom'
import { Formik } from 'formik'

import { CREATE_WORLD_MUTATION, CREATE_WORLD_SCHEMA } from '../../../../../lib/graphql'
import { Hint } from '../../../../Utils'

const CreateNewWorld = withRouter(({ history, match }) => {
	const gamemodes = ['SURVIVAL', 'CREATIVE', 'SPECTATOR', 'ADVENTURE']
	const [gamemode, setGamemode] = useState(0)

	return (
		<Mutation
			mutation={CREATE_WORLD_MUTATION}
			onCompleted={data => {
				const {
					createWorld: { id }
				} = data

				history.push(`/game/minecraft/${id}`)
			}}
			onError={error => console.error(error)}>
			{(createWorld, { loading }) =>
				loading ? (
					<Hint text="Generating" />
				) : (
					<Formik
						initialValues={{ name: '', seed: '' }}
						validationSchema={CREATE_WORLD_SCHEMA}
						onSubmit={(values, { setSubmitting }) => {
							createWorld({
								variables: {
									...values,
									gamemode: gamemodes[gamemode]
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
						}) => {
							return (
								<form
									onSubmit={handleSubmit}
									style={{ display: 'flex', flexDirection: 'column' }}>
									<h1>Create New World</h1>
									<input
										id="name"
										name="name"
										value={values.name}
										label="name"
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder="Name"
									/>
									<input
										id="seed"
										name="seed"
										value={values.password}
										type="seed"
										label="Seed"
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder="Seed"
									/>
									<button
										type="button"
										onClick={() => {
											setGamemode((gamemode + 1) % 4)
										}}>
										{gamemodes[gamemode]}
									</button>
									<button
										type="submit"
										disabled={
											!values.name ||
											!values.seed ||
											isSubmitting ||
											!!(errors.name && touched.name) ||
											!!(errors.seed && touched.seed)
										}>
										Create New World
									</button>
									<button onClick={() => history.goBack()}>
										Cancel
									</button>
								</form>
							)
						}}
					/>
				)
			}
		</Mutation>
	)
})

export default CreateNewWorld
