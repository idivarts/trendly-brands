import GrowthBookProtected from '@/components/landing/GrowthBookProtected'
import CreateBrandPage from '@/components/landing/pages/create-brand'
import React from 'react'

const CreateBrand = () => {
    return (
        <GrowthBookProtected>
            <CreateBrandPage />
        </GrowthBookProtected>
    )
}

export default CreateBrand