// import { ThemedText } from "@/components/ThemedText";
// import { useState } from "react";
// import { ScrollView, TouchableOpacity } from "react-native";
// import { Platform, SafeAreaView, View } from "react-native";
// import Web from "../../components/Web";
// import { Feather } from "@expo/vector-icons";
// import Radio from "../../components/Radio";

// export default function LivingScreen() {
//   const [index, setIndex] = useState(0);
//   return (
//     <SafeAreaView>
//       <View className={`p-4 ${Platform.OS == "android" && "pt-12 pb-4 px-4"}`}>
//         <View className="flex-row items-center justify-end">
//           <View className="relative">
//             <Feather name="share-2" size={20} color="black" />
//           </View>
//         </View>
//       </View>

//       <View className="px-4 flex justify-center relative z-50 items-center bg-[#e9e9e9] h-[40px]">
//         <View className="flex flex-row items-center gap-x-3 w-[90%] h-[30px]">
//           <TouchableOpacity
//             className={`w-[45%] flex justify-center items-center ${
//               index == 0 && "bg-[#A60A0A]"
//             } h-full rounded-[5px]`}
//             onPress={() => setIndex(0)}
//           >
//             <ThemedText
//               className={`${index == 0 && "text-white"} text-[12px] font-[600]`}
//             >
//               Web
//             </ThemedText>
//           </TouchableOpacity>
//           <TouchableOpacity
//             className={`w-[45%] flex justify-center items-center ${
//               index == 1 && "bg-[#A60A0A]"
//             } h-full rounded-[5px]`}
//             onPress={() => setIndex(1)}
//           >
//             <ThemedText
//               className={`${index == 1 && "text-white"} text-[12px] font-[600]`}
//             >
//               Radio
//             </ThemedText>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView className="w-full h-[80vh]">
//         {index == 0 ? <Web /> : <Radio />}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

import React from "react";
import { StyleSheet, Text, View } from "react-native";

const livingtv = () => {
  return (
    <View>
      <Text>livingtv</Text>
    </View>
  );
};

export default livingtv;

const styles = StyleSheet.create({});
