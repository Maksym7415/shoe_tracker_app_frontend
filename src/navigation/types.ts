import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Shoes: undefined;
  'Shoes/Add': undefined;
  'Shoes/Edit': { id: number };
  'Shoes/Detail': { id: number };
  Activities: undefined;
  'Activities/Add': undefined;
  'Activities/Detail': { id: number };
  'Activities/Edit': { id: number };
  Profile: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;
