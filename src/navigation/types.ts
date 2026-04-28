import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};


export type MainStackParamList = {
  'Shoes/List': undefined;
  'Shoes/Add': undefined;
  'Shoes/Edit': { id: number };
  'Shoes/Detail': { id: number };
  'Shoes/Components': { parentId: number };
  'Shoes/Service/Add': { gearId: number };
  'Shoes/Service/Edit': { gearId: number; serviceId: number };
  'Activities/List': undefined;
  'Activities/Add': undefined;
  'Activities/Detail': { id: number };
  'Activities/Edit': { id: number };
  'Profile/View': undefined;
  'Profile/Edit': undefined;
};

export const MainRoutes = {
  ShoesList: 'Shoes/List',
  ShoesAdd: 'Shoes/Add',
  ShoesEdit: 'Shoes/Edit',
  ShoesDetail: 'Shoes/Detail',
  ShoesComponents: 'Shoes/Components',
  ShoesServiceAdd: 'Shoes/Service/Add',
  ShoesServiceEdit: 'Shoes/Service/Edit',
  ActivitiesList: 'Activities/List',
  ActivitiesAdd: 'Activities/Add',
  ActivitiesDetail: 'Activities/Detail',
  ActivitiesEdit: 'Activities/Edit',
  ProfileView: 'Profile/View',
  ProfileEdit: 'Profile/Edit',
} as const;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;
