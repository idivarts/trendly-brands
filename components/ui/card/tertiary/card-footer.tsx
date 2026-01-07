import React from 'react';

import { View } from '@/components/theme/Themed';

type CardFooterProps = {
    footerActions?: React.ReactNode;
};

export const CardFooter = ({
    footerActions = null,
}: CardFooterProps) => {
    return (
        <View
            style={{
                backgroundColor: 'transparent',
            }}
        >
            {footerActions}
        </View>
    );
};
