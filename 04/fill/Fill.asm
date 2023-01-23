// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

// Put your code here.
(LOOP)
    @KBD
    D=M

    @WHITE
    D;JGT

    @BLACK
    0;JMP

    (WHITE)

        @COLOR
        M=-1

        @DRAW
        0;JMP


    (BLACK)
        @COLOR
        M=0

    (DRAW)

        @8192
        D=A
        @COUNTER
        M=D

        (NEXT_PIXEL)
            // compute address
            @SCREEN
            D=A
            @COUNTER
            D=D+M

            // store it away temporarily
            @R0
            M=D

            // load the color to draw
            @COLOR
            D=M
            // write it to the stored address
            @R0
            A=M
            M=D

            // decrement counter
            @COUNTER
            MD=M-1
            
            // check if we're done
            @NEXT_PIXEL
            D;JGE
        
        @LOOP
        0;JMP
