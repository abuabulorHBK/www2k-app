import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Buyer Screens
import HomeScreen from '../screens/buyer/HomeScreen';
import SearchScreen from '../screens/buyer/SearchScreen';
import ProductDetailScreen from '../screens/buyer/ProductDetailScreen';
import SellerProfileScreen from '../screens/buyer/SellerProfileScreen';
import CartScreen from '../screens/buyer/CartScreen';
import OrderHistoryScreen from '../screens/buyer/OrderHistoryScreen';
import ProfileScreen from '../screens/buyer/ProfileScreen';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Seller Screens
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import MyProductsScreen from '../screens/seller/MyProductsScreen';
import AddProductScreen from '../screens/seller/AddProductScreen';
import IncomingOrdersScreen from '../screens/seller/IncomingOrdersScreen';
import SellerRegisterScreen from '../screens/seller/SellerRegisterScreen';
import PendingApprovalScreen from '../screens/seller/PendingApprovalScreen';
import UpgradePlanScreen from '../screens/seller/UpgradePlanScreen';

// Review Screens
import WriteReviewScreen from '../screens/buyer/WriteReviewScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function BuyerTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Orders" component={OrderHistoryScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function SellerTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Dashboard" component={SellerDashboardScreen} />
            <Tab.Screen name="Products" component={MyProductsScreen} />
            <Tab.Screen name="Orders" component={IncomingOrdersScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator({ userRole, isAuthenticated }) {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                ) : userRole === 'seller' ? (
                    <>
                        <Stack.Screen name="SellerTabs" component={SellerTabs} />
                        <Stack.Screen name="AddProduct" component={AddProductScreen} />
                        <Stack.Screen name="UpgradePlan" component={UpgradePlanScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
                        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                        <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
                        <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
                        <Stack.Screen name="SellerRegister" component={SellerRegisterScreen} />
                        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
