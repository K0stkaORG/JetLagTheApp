import { Text, View, Pressable } from "react-native";
import * as Dialog from "@rn-primitives/dialog";

export function ExampleDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Pressable className="px-4 py-2 rounded bg-primary">
          <Text className="text-primary-foreground">Open dialog</Text>
        </Pressable>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="absolute inset-0 bg-black/50" />
        <Dialog.Content className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-4 rounded w-[80%] max-w-sm">
          <Dialog.Title className="text-foreground text-lg font-semibold">Hello from RN Primitives</Dialog.Title>
          <View className="mt-2">
            <Text className="text-muted-foreground">
              This is an example of using @rn-primitives components in the new mobile app.
            </Text>
          </View>
          <Dialog.Close asChild>
            <Pressable className="mt-4 px-4 py-2 rounded bg-secondary self-end">
              <Text className="text-secondary-foreground">Close</Text>
            </Pressable>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

