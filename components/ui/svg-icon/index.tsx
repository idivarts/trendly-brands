import { Image, ImageProps } from "react-native";

interface SvgIconProps extends ImageProps { }

const SvgIcon: React.FC<SvgIconProps> = ({
    style,
    ...props
}) => {
    return (
        <Image
            style={[
                {
                    width: 30,
                    height: 30,
                },
                style,
            ]}
            {...props}
        />
    );
};

export default SvgIcon;
