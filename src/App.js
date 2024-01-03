import React from 'react'
import { DataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import classes from './App.module.css'
import Home from './Home'

const query = {
    me: {
        resource: 'me',
    },
}

const MyApp = () => (
    <div >
        <DataQuery query={query}>
            {({ error, loading, data }) => {
                if (error) return <span>ERROR</span>
                if (loading) return <span>...</span>
                return (
                    <>
                        <Home />
                    </>
                )
            }}
        </DataQuery>
    </div>
)

export default MyApp
